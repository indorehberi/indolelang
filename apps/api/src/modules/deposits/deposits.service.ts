import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { logger } from '../../lib/logger';
import { ErrorCode } from '@indo-lelang/utils';
import { DepositDTO, PaginationMeta, DepositStatus, Role } from '@indo-lelang/shared-types';
import { midtransClient } from '../../lib/midtrans';
import { sendEmail } from '../../lib/email';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { calculateGatewayFee } from '../../utils/paymentCalculator';

export class DepositsService {
  /**
   * Get all deposits (paginated, with search/filters)
   */
  async getDeposits(
    page: number,
    perPage: number,
    userId?: string,
    sessionId?: string,
    status?: string
  ): Promise<{ deposits: DepositDTO[]; meta: PaginationMeta }> {
    const where: Prisma.depositsWhereInput = {};

    if (userId) {
      where.user_id = userId;
    }
    if (sessionId) {
      where.session_id = sessionId;
    }
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * perPage;

    const [total, records] = await Promise.all([
      prisma.deposits.count({ where }),
      prisma.deposits.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              full_name: true,
              email: true,
              phone: true,
            },
          },
          session: {
            select: {
              title: true,
            },
          },
        },
      }),
    ]);

    const deposits: any[] = records.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      session_id: r.session_id,
      amount: Number(r.amount),
      unit_type: r.unit_type || undefined,
      package_type: r.package_type || undefined,
      va_number: r.va_number || undefined,
      va_bank: r.va_bank || undefined,
      payment_method: r.payment_method || undefined,
      status: r.status,
      paid_at: r.paid_at ? r.paid_at.toISOString() : undefined,
      created_at: r.created_at.toISOString(),
      user: r.user,
      session: r.session,
    }));

    const totalPages = Math.ceil(total / perPage);

    return {
      deposits,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Create a new deposit request (Register NIPL and generate VA)
   */
  async createDeposit(
    userId: string,
    sessionId: string | null | undefined,
    unit_type: string,
    package_type: string,
    bank: 'bca' | 'mandiri' | 'bni' | 'bri' | 'permata' | 'qris'
  ): Promise<DepositDTO> {
    // 1. Verify user exists and is a bidder
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, ErrorCode.USER_NOT_FOUND, 'User tidak ditemukan');
    }

    // 2. No session validation needed anymore because NIPL is global (cross-session).
    const targetSessionId = null;


    // Fetch settings for Fee Bearer and NIPL Amounts
    const settings = await prisma.platform_settings.findMany({
      where: {
        key: { in: ['FEE_BEARER', 'nipl_deposit_amount', 'nipl_motor_deposit_amount', 'deposit_payment_mode', 'manual_payment_bank', 'manual_payment_account', 'manual_payment_name'] }
      }
    });

    const feeBearer = settings.find(s => s.key === 'FEE_BEARER')?.value || 'admin';
    const niplMobilBase = parseInt(settings.find(s => s.key === 'nipl_deposit_amount')?.value || '5000000', 10);
    const niplMotorBase = parseInt(settings.find(s => s.key === 'nipl_motor_deposit_amount')?.value || '1000000', 10);
    const depositPaymentMode = settings.find(s => s.key === 'deposit_payment_mode')?.value || 'auto';
    const manualPaymentBank = settings.find(s => s.key === 'manual_payment_bank')?.value || 'BCA';
    const manualPaymentAccount = settings.find(s => s.key === 'manual_payment_account')?.value || '7015886161';
    const manualPaymentName = settings.find(s => s.key === 'manual_payment_name')?.value || 'PT Indo Lelang Sejahtera';

    // 3. Calculate amount based on unit_type and package_type
    let amount = 0;
    if (unit_type === 'mobil') {
      if (package_type === 'unlimited') {
        amount = niplMobilBase * 5; // Default unlimited is 5x base
      } else {
        amount = parseInt(package_type) * niplMobilBase;
      }
    } else if (unit_type === 'motor') {
      if (package_type === 'unlimited') {
        amount = niplMotorBase * 5; // Default unlimited is 5x base
      } else {
        amount = parseInt(package_type) * niplMotorBase;
      }
    } else {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Jenis unit tidak valid');
    }

    let gatewayFee = 0;
    
    if (feeBearer === 'customer') {
      gatewayFee = calculateGatewayFee(amount, bank);
    }
    
    const grossAmount = amount + gatewayFee;

    // Generate deposit record ID beforehand to use as Midtrans order ID
    const depositId = crypto.randomUUID();
    const orderId = `NIPL-${depositId}`;

    // 4. Request Midtrans for VA details with a mock fallback for local testing, or bypass if manual mode
    let midtransRes;
    
    if (depositPaymentMode === 'manual') {
      midtransRes = {
        order_id: orderId,
        va_number: manualPaymentAccount,
        va_bank: `manual_${manualPaymentBank.toLowerCase()}`,
        payment_method: 'manual_transfer',
        raw_response: { status_message: 'Manual payment instructed', account_name: manualPaymentName }
      };
    } else {
      try {
        midtransRes = await midtransClient.chargeVirtualAccount({
          orderId,
          amount: grossAmount, // pass the new total including fee
          bank,
        });
      } catch (error) {
        logger.warn({ error, orderId }, 'Midtrans charge failed. Falling back to Mock Payment Details.');
        const dummyVa = `70088${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        midtransRes = {
          order_id: orderId,
          va_number: bank === 'qris' ? 'https://midtrans.com/qris-mock' : dummyVa,
          va_bank: bank,
          payment_method: bank === 'qris' ? 'qris' : 'virtual_account',
          raw_response: { status_message: 'Mock payment created due to inactive midtrans channel' }
        };
      }
    }

    // 5. Expire any old pending deposits for the same session/free and user
    await prisma.deposits.updateMany({
      where: {
        user_id: userId,
        session_id: targetSessionId,
        status: DepositStatus.PENDING,
      },
      data: {
        status: DepositStatus.EXPIRED,
      },
    });

    // 6. Save deposit to database
    const deposit = await prisma.deposits.create({
      data: {
        id: depositId,
        user_id: userId,
        session_id: targetSessionId,
        amount: new Prisma.Decimal(amount),
        gateway_fee: new Prisma.Decimal(gatewayFee),
        unit_type,
        package_type,
        va_number: midtransRes.va_number,
        va_bank: midtransRes.va_bank,
        payment_method: midtransRes.payment_method,
        status: DepositStatus.PENDING,
      },
    });

    // 7. Send notification email with VA details asynchronously
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
    
    const isManual = depositPaymentMode === 'manual';
    const emailMethod = isManual ? `Transfer Manual ${manualPaymentBank}` : (bank === 'qris' ? 'QRIS' : bank.toUpperCase() + ' Virtual Account');
    const emailNumberTitle = isManual ? 'No. Rekening Tujuan' : (bank === 'qris' ? 'QR Code URL' : 'Nomor Virtual Account');
    const emailNumberValue = isManual ? `${manualPaymentAccount} a.n ${manualPaymentName}` : midtransRes.va_number;

    sendEmail({
      to: user.email,
      subject: `[Indo-Lelang] Pembayaran NIPL (Saldo Bebas Lintas Sesi)`,
      text: `Halo ${user.full_name},\n\nAnda telah mengajukan pendaftaran NIPL Bebas (Saldo Terbuka). Silakan lakukan pembayaran deposit sebesar ${formattedAmount} melalui ${emailMethod}.\n\n${emailNumberTitle}: ${emailNumberValue}\nStatus: Menunggu Pembayaran (Berlaku 60 menit)\n\nTerima kasih,\nTim Indo-Lelang`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2b6cb0;">Pendaftaran NIPL Indo-Lelang</h2>
          <p>Halo <strong>${user.full_name}</strong>,</p>
          <p>Anda telah mengajukan pendaftaran NIPL Bebas (Saldo Terbuka) yang dapat digunakan pada semua sesi lelang.</p>
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #718096;">Jumlah Jaminan:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #2d3748;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">Metode Pembayaran:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #2d3748;">${emailMethod}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">${emailNumberTitle}:</td>
                <td style="padding: 6px 0; font-size: 1.1rem; font-weight: bold; color: #e53e3e; word-break: break-all;">${emailNumberValue}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">Status:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #dd6b20;">Menunggu Pembayaran</td>
              </tr>
            </table>
          </div>
          <p style="color: #718096; font-size: 0.9rem;">Catatan: Metode pembayaran ini berlaku selama 60 menit. Harap segera menyelesaikan pembayaran sebelum batas waktu berakhir.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 0.8rem; color: #a0aec0; text-align: center;">Email ini dikirimkan secara otomatis oleh sistem Indo-Lelang. Harap tidak membalas email ini.</p>
        </div>
      `,
    }).catch((err) => {
      // Log error silently, do not block API response
      logger.error({ err }, 'Failed to send deposit email');
    });

    return {
      id: deposit.id,
      user_id: deposit.user_id,
      session_id: deposit.session_id || '',
      amount: Number(deposit.amount),
      unit_type: deposit.unit_type || undefined,
      package_type: deposit.package_type || undefined,
      va_number: deposit.va_number || undefined,
      va_bank: deposit.va_bank || undefined,
      payment_method: deposit.payment_method || undefined,
      status: deposit.status,
      paid_at: deposit.paid_at ? deposit.paid_at.toISOString() : undefined,
      created_at: deposit.created_at.toISOString(),
    };
  }

  /**
   * Request refund for a paid deposit (Bidder initiated)
   */
  async requestRefund(userId: string, depositId: string): Promise<any> {
    const deposit = await prisma.deposits.findUnique({
      where: { id: depositId },
    });

    if (!deposit || deposit.user_id !== userId) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Deposit tidak ditemukan');
    }

    if (deposit.status !== 'paid') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Hanya deposit berstatus paid yang dapat diajukan refund');
    }

    // Check if user is currently winning an active lot in ANY session
    const activeWonLots = await prisma.bids.findFirst({
      where: {
        bidder_id: userId,
        is_winning: true,
        lot: {
          status: 'active'
        }
      }
    });

    if (activeWonLots) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Tidak dapat mengajukan refund karena Anda sedang memenangkan lot yang masih aktif.');
    }

    // Check if user has ANY unpaid invoices
    const overdueInvoices = await prisma.invoices.count({
      where: {
        bidder_id: userId,
        status: { in: ['unpaid', 'overdue'] },
      }
    });

    if (overdueInvoices > 0) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Tidak dapat mengajukan refund karena Anda memiliki tagihan pelunasan yang belum dibayar.');
    }

    const updated = await prisma.deposits.update({
      where: { id: depositId },
      data: { status: 'pending_refund' }
    });

    return updated;
  }

  /**
   * Mark a manual deposit as paid (Admin only)
   */
  async markManualDepositAsPaid(depositId: string, adminId: string): Promise<any> {
    const deposit = await prisma.deposits.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Deposit tidak ditemukan');
    }

    if (deposit.payment_method !== 'manual_transfer') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Hanya deposit manual transfer yang dapat disetujui melalui fitur ini');
    }

    if (deposit.status === 'paid') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Deposit sudah dalam status Paid (Lunas)');
    }

    if (deposit.status !== 'pending') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Hanya deposit berstatus Pending yang dapat ditandai Paid');
    }

    const updated = await prisma.deposits.update({
      where: { id: depositId },
      data: {
        status: 'paid',
        paid_at: new Date(),
      },
    });

    return updated;
  }
}
