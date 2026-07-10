import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { midtransClient } from '../../lib/midtrans';
import { sendEmail } from '../../lib/email';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { sendSuccess } from '../../lib/apiResponse';
import { paymentsService } from './payments.service';
import { Role } from '@indo-lelang/shared-types';
import { Prisma } from '@prisma/client';
import { logger } from '../../lib/logger';

export class PaymentsController {
  /**
   * Handle Midtrans Webhook Callback (Supports NIPL deposits and Invoice pelunasan)
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notification = req.body;

      // 1. Verify Midtrans Webhook Signature
      const isValid = await midtransClient.verifyWebhookSignature({
        order_id: notification.order_id,
        status_code: notification.status_code,
        gross_amount: notification.gross_amount,
        signature_key: notification.signature_key,
      });

      if (!isValid) {
        throw new AppError(400, ErrorCode.UNAUTHORIZED, 'Signature webhook tidak valid');
      }

      const orderId = notification.order_id || '';
      const transactionStatus = notification.transaction_status;

      // --- 2. Handle NIPL Deposit Webhook ---
      if (orderId.startsWith('NIPL-')) {
        const depositId = orderId.replace('NIPL-', '');

        const deposit = await prisma.deposits.findUnique({
          where: { id: depositId },
          include: {
            session: {
              select: {
                title: true,
              },
            },
            user: {
              select: {
                email: true,
                full_name: true,
              },
            },
          },
        });

        if (!deposit) {
          throw new AppError(404, ErrorCode.NOT_FOUND, 'Transaksi deposit tidak ditemukan');
        }

        if (deposit.status === 'paid') {
          sendSuccess(res, null, 'Pembayaran sudah diproses sebelumnya');
          return;
        }

        if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
          const updatePromises: any[] = [
            prisma.deposits.update({
              where: { id: depositId },
              data: {
                status: 'paid',
                paid_at: new Date(),
              },
            }),
          ];

          const formattedAmount = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(Number(deposit.amount));

          updatePromises.push(
            prisma.notifications.create({
              data: {
                user_id: deposit.user_id,
                type: 'deposit_success',
                title: 'Deposit Berhasil',
                body: deposit.session_id
                  ? `NIPL Anda untuk sesi "${deposit.session?.title || 'Sesi Lelang'}" sudah aktif`
                  : `Jaminan NIPL Bebas sebesar ${formattedAmount} telah berhasil ditambahkan ke saldo Anda`,
              },
            }),
            prisma.audit_logs.create({
              data: {
                action: 'PAYMENT_WEBHOOK',
                resource_type: 'deposit',
                resource_id: depositId,
                new_value: transactionStatus,
              },
            })
          );

          await prisma.$transaction(updatePromises);

          sendEmail({
            to: deposit.user.email,
            subject: `[Indo-Lelang] Pembayaran Deposit NIPL Berhasil`,
            text: deposit.session_id
              ? `Halo ${deposit.user.full_name},\n\nPembayaran jaminan deposit sebesar ${formattedAmount} untuk sesi lelang "${deposit.session?.title || 'Sesi Lelang'}" telah kami terima.\n\nNIPL Anda kini telah AKTIF. Anda dapat mengikuti proses bidding saat sesi lelang tersebut dimulai.\n\nTerima kasih,\nTim Indo-Lelang`
              : `Halo ${deposit.user.full_name},\n\nPembayaran jaminan deposit bebas sebesar ${formattedAmount} telah kami terima.\n\nSaldo NIPL Bebas Anda kini telah AKTIF. Anda dapat mengalokasikannya ke sesi lelang aktif mana saja kapan saja melalui Dashboard.\n\nTerima kasih,\nTim Indo-Lelang`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2f855a;">Pembayaran Deposit Berhasil</h2>
                <p>Halo <strong>${deposit.user.full_name}</strong>,</p>
                <p>Pembayaran deposit NIPL Anda telah kami terima.</p>
                <div style="background-color: #f0fff4; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #c6f6d5;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; color: #4a5568;">Sesi Lelang:</td>
                      <td style="padding: 6px 0; font-weight: bold; color: #2d3748;">${deposit.session_id ? deposit.session?.title : 'NIPL Bebas (Saldo Terbuka)'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #4a5568;">Jumlah Jaminan:</td>
                      <td style="padding: 6px 0; font-weight: bold; color: #2d3748;">${formattedAmount}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #4a5568;">Status NIPL:</td>
                      <td style="padding: 6px 0; font-weight: bold; color: #38a169;">AKTIF</td>
                    </tr>
                  </table>
                </div>
                <p>${deposit.session_id 
                  ? 'Anda sekarang dapat mengikuti dan melakukan bidding pada sesi lelang tersebut saat jadwalnya dimulai.' 
                  : 'Anda dapat mengalokasikan saldo jaminan ini untuk mendaftar sesi lelang aktif apa saja lewat menu Kelola Alokasi.'}</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 0.8rem; color: #a0aec0; text-align: center;">Email ini dikirimkan secara otomatis oleh sistem Indo-Lelang. Harap tidak membalas email ini.</p>
              </div>
            `,
          }).catch((err) => {
            logger.error({ err }, 'Failed to send deposit success email');
          });

          sendSuccess(res, null, 'Pembayaran deposit berhasil diproses');
        } else if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
          await prisma.$transaction([
            prisma.deposits.update({
              where: { id: depositId },
              data: {
                status: 'expired',
              },
            }),
            prisma.audit_logs.create({
              data: {
                action: 'PAYMENT_WEBHOOK',
                resource_type: 'deposit',
                resource_id: depositId,
                new_value: transactionStatus,
              },
            }),
          ]);

          sendSuccess(res, null, `Pembayaran deposit expired/dibatalkan (${transactionStatus})`);
        } else {
          sendSuccess(res, null, `Webhook deposit diterima (${transactionStatus})`);
        }
        return;
      }

      // --- 3. Handle Invoice Payment Webhook ---
      if (orderId.startsWith('INV-')) {
        const invoiceId = orderId.replace('INV-', '');

        const invoice = await prisma.invoices.findUnique({
          where: { id: invoiceId },
          include: {
            bidder: {
              select: {
                email: true,
                full_name: true,
              },
            },
            lot: {
              include: {
                asset: {
                  include: {
                    provider: true,
                  },
                },
              },
            },
          },
        });

        if (!invoice) {
          throw new AppError(404, ErrorCode.NOT_FOUND, 'Invoice pelunasan tidak ditemukan');
        }

        if (invoice.status === 'paid') {
          sendSuccess(res, null, 'Invoice pelunasan sudah diproses sebelumnya');
          return;
        }

        if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
          await prisma.$transaction([
            prisma.invoices.update({
              where: { id: invoiceId },
              data: {
                status: 'paid',
                paid_at: new Date(),
              },
            }),
            prisma.notifications.create({
              data: {
                user_id: invoice.bidder_id,
                type: 'invoice_paid',
                title: 'Pelunasan Invoice Diterima',
                body: `Pelunasan lelang unit "${invoice.lot.asset.title}" telah diverifikasi. Dokumen Surat Jalan dan BAST kini aktif.`,
              },
            }),
            prisma.audit_logs.create({
              data: {
                action: 'PAYMENT_WEBHOOK_INVOICE',
                resource_type: 'invoice',
                resource_id: invoiceId,
                new_value: transactionStatus,
              },
            }),
          ]);

          // Provider settlement — shared formula with the manual "tandai lunas" path.
          await paymentsService.createSettlementForInvoice(invoiceId);

          const formattedTotal = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(Number(invoice.total));

          sendEmail({
            to: invoice.bidder.email,
            subject: `[Indo-Lelang] Pembayaran Pelunasan Lelang Berhasil`,
            text: `Halo ${invoice.bidder.full_name},\n\nPembayaran pelunasan sebesar ${formattedTotal} untuk unit "${invoice.lot.asset.title}" telah diverifikasi secara sukses.\n\nDokumen Surat Jalan dan Berita Acara Serah Terima (BAST) digital kini dapat diunduh melalui akun panel admin/aplikasi Anda.\n\nTerima kasih,\nTim Indo-Lelang`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2f855a;">Pelunasan Invoice Berhasil</h2>
                <p>Halo <strong>${invoice.bidder.full_name}</strong>,</p>
                <p>Pembayaran pelunasan Anda untuk unit berikut telah kami terima:</p>
                <div style="background-color: #f0fff4; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #c6f6d5;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; color: #4a5568;">Unit Aset:</td>
                      <td style="padding: 6px 0; font-weight: bold; color: #2d3748;">${invoice.lot.asset.title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #4a5568;">Total Pelunasan:</td>
                      <td style="padding: 6px 0; font-weight: bold; color: #2d3748;">${formattedTotal}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #4a5568;">Status Tagihan:</td>
                      <td style="padding: 6px 0; font-weight: bold; color: #38a169;">LUNAS</td>
                    </tr>
                  </table>
                </div>
                <p>Dokumen Surat Jalan dan Berita Acara Serah Terima (BAST) Anda kini dapat diunduh langsung dari dashboard Keuangan.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 0.8rem; color: #a0aec0; text-align: center;">Email ini dikirimkan secara otomatis oleh sistem Indo-Lelang. Harap tidak membalas email ini.</p>
              </div>
            `,
          }).catch((err) => {
            logger.error({ err }, 'Failed to send invoice success email');
          });

          sendSuccess(res, null, 'Pembayaran invoice pelunasan berhasil diproses');
        } else if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
          await prisma.$transaction([
            prisma.invoices.update({
              where: { id: invoiceId },
              data: {
                status: 'expired',
              },
            }),
            prisma.audit_logs.create({
              data: {
                action: 'PAYMENT_WEBHOOK_INVOICE',
                resource_type: 'invoice',
                resource_id: invoiceId,
                new_value: transactionStatus,
              },
            }),
          ]);

          sendSuccess(res, null, `Pembayaran invoice expired/dibatalkan (${transactionStatus})`);
        } else {
          sendSuccess(res, null, `Webhook invoice diterima (${transactionStatus})`);
        }
        return;
      }

      // 4. Default fallback for other order structures
      sendSuccess(res, null, 'Webhook diterima (tipe order tidak dikenal)');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET list of settlements (Admin/Operator sees all, Provider sees own)
   */
  async getSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const perPage = parseInt(req.query.per_page as string || '20', 10);
      const { status } = req.query as any;

      let providerId: string | undefined;
      if (req.user!.role === Role.PROVIDER) {
        providerId = req.user!.id;
      } else {
        providerId = req.query.provider_id as string || undefined;
      }

      const { settlements, meta } = await paymentsService.getSettlements(
        page,
        perPage,
        status,
        providerId
      );

      sendSuccess(res, settlements, 'Daftar settlement berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST execute provider settlement payout (Admin/Operator only)
   */
  async disburseSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await paymentsService.disburseSettlement(id);
      sendSuccess(res, result, 'Pencairan dana ke provider berhasil dilakukan');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET refund queue (Admin/Operator only)
   */
  async getRefundQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const perPage = parseInt(req.query.per_page as string || '20', 10);

      const { queue, meta } = await paymentsService.getRefundQueue(page, perPage);
      sendSuccess(res, queue, 'Antrean refund berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST execute manual refund approval (Admin/Operator only)
   */
  async refundDeposit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await paymentsService.refundDeposit(id);
      sendSuccess(res, result, 'Refund uang jaminan deposit berhasil disetujui');
    } catch (error) {
      next(error);
    }
  }
}

export default PaymentsController;
