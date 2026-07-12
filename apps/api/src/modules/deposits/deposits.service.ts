import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { logger } from '../../lib/logger';
import { ErrorCode } from '@indo-lelang/utils';
import { DepositDTO, PaginationMeta, DepositStatus, Role } from '@indo-lelang/shared-types';
import { sendEmail, sendEmailSafe } from '../../lib/email';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { notifyAdmins } from '../../lib/notifyAdmins';

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
      transfer_proof_url: r.transfer_proof_url || undefined,
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


    // Fetch settings for NIPL Amounts and manual transfer details.
    // Payment gateway is currently disabled platform-wide (not ready yet) —
    // every deposit goes through manual bank transfer regardless of any
    // stored 'deposit_payment_mode' setting.
    const settings = await prisma.platform_settings.findMany({
      where: {
        key: { in: ['nipl_deposit_amount', 'nipl_motor_deposit_amount', 'manual_payment_bank', 'manual_payment_account', 'manual_payment_name', 'manual_transfer_fee', 'manual_refund_fee'] }
      }
    });

    const niplMobilBase = parseInt(settings.find(s => s.key === 'nipl_deposit_amount')?.value || '5000000', 10);
    const niplMotorBase = parseInt(settings.find(s => s.key === 'nipl_motor_deposit_amount')?.value || '1000000', 10);
    const manualPaymentBank = settings.find(s => s.key === 'manual_payment_bank')?.value || 'BCA';
    const manualPaymentAccount = settings.find(s => s.key === 'manual_payment_account')?.value || '7015886161';
    const manualPaymentName = settings.find(s => s.key === 'manual_payment_name')?.value || 'PT Indo Lelang Sejahtera';
    const manualTransferFee = parseFloat(settings.find(s => s.key === 'manual_transfer_fee')?.value || '0');
    const manualRefundFee = parseFloat(settings.find(s => s.key === 'manual_refund_fee')?.value || '0');

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

    const transferFee = manualTransferFee;
    const refundFee = manualRefundFee;

    // Generate deposit record ID
    const depositId = crypto.randomUUID();

    // Manual transfer instructions — payment gateway is disabled, so this is
    // the only path.
    const midtransRes = {
      va_number: manualPaymentAccount,
      va_bank: `manual_${manualPaymentBank.toLowerCase()}`,
      payment_method: 'manual_transfer',
    };

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
        gateway_fee: new Prisma.Decimal(0),
        transfer_fee: new Prisma.Decimal(transferFee),
        refund_fee: new Prisma.Decimal(refundFee),
        is_manual: true,
        unit_type,
        package_type,
        va_number: midtransRes.va_number,
        va_bank: midtransRes.va_bank,
        payment_method: midtransRes.payment_method,
        status: DepositStatus.PENDING,
      },
    });

    // 7. Send notification email with manual transfer instructions
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

    const emailMethod = `Transfer Manual ${manualPaymentBank}`;
    const emailNumberValue = `${manualPaymentAccount} a.n ${manualPaymentName}`;

    sendEmailSafe({
      to: user.email,
      subject: `[Indo-Lelang] Pembayaran NIPL (Saldo Bebas Lintas Sesi)`,
      text: `Halo ${user.full_name},\n\nAnda telah mengajukan pendaftaran NIPL Bebas (Saldo Terbuka). Silakan lakukan pembayaran deposit sebesar ${formattedAmount} melalui ${emailMethod}.\n\nNo. Rekening Tujuan: ${emailNumberValue}\nStatus: Menunggu Transfer\n\nSetelah transfer, unggah bukti transfer Anda di halaman Deposit NIPL agar tim kami dapat memverifikasi dan mengaktifkan NIPL Anda.\n\nTerima kasih,\nTim Indo-Lelang`,
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
                <td style="padding: 6px 0; color: #718096;">No. Rekening Tujuan:</td>
                <td style="padding: 6px 0; font-size: 1.1rem; font-weight: bold; color: #e53e3e; word-break: break-all;">${emailNumberValue}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">Status:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #dd6b20;">Menunggu Transfer</td>
              </tr>
            </table>
          </div>
          <p style="color: #718096; font-size: 0.9rem;">Setelah transfer, unggah bukti transfer Anda di halaman Deposit NIPL agar tim kami dapat memverifikasi dan mengaktifkan NIPL Anda.</p>
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
      include: { user: { select: { full_name: true } } },
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

    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(deposit.amount));
    await notifyAdmins(
      'refund_requested',
      'Permintaan Refund NIPL',
      `${deposit.user.full_name} mengajukan refund NIPL sebesar ${formattedAmount}.`,
      '/finance/refunds'
    );

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

    if (deposit.status !== 'pending' && deposit.status !== 'pending_approval') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Hanya deposit berstatus Pending / Pending Approval yang dapat ditandai Paid');
    }

    const updated = await prisma.deposits.update({
      where: { id: depositId },
      data: {
        status: 'paid',
        paid_at: new Date(),
      },
    });

    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(deposit.amount));
    await prisma.notifications.create({
      data: {
        user_id: deposit.user_id,
        type: 'deposit_approved',
        title: 'NIPL Aktif',
        body: `Transfer deposit NIPL Anda sebesar ${formattedAmount} telah diverifikasi. NIPL Anda kini aktif dan bisa dipakai untuk mengikuti lelang.`,
      },
    });

    return updated;
  }

  /**
   * Mark deposit as refunded (Admin only)
   */
  async markAsRefunded(depositId: string, adminId: string): Promise<any> {
    const deposit = await prisma.deposits.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Deposit tidak ditemukan');
    }

    if (deposit.status !== 'pending_refund' && deposit.status !== 'paid') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Hanya deposit berstatus pending_refund atau paid yang dapat ditandai refunded');
    }

    const updated = await prisma.deposits.update({
      where: { id: depositId },
      data: {
        status: 'refunded',
      },
    });

    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(deposit.amount));
    await prisma.notifications.create({
      data: {
        user_id: deposit.user_id,
        type: 'refund_processed',
        title: 'Refund NIPL Selesai',
        body: `Pengembalian dana (refund) deposit NIPL Anda sebesar ${formattedAmount} telah selesai ditransfer ke rekening Anda.`,
      },
    });

    return updated;
  }

  /**
   * Upload transfer proof and mark deposit as pending approval
   */
  async uploadTransferProof(userId: string, depositId: string, proofUrl: string): Promise<any> {
    const deposit = await prisma.deposits.findUnique({
      where: { id: depositId },
      include: { user: { select: { full_name: true } } },
    });

    if (!deposit || deposit.user_id !== userId) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Deposit tidak ditemukan');
    }

    if (deposit.payment_method !== 'manual_transfer') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Bukti transfer hanya untuk pembayaran manual');
    }

    if (deposit.status !== 'pending') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Hanya deposit berstatus pending yang dapat diunggah bukti transfernya');
    }

    const updated = await prisma.deposits.update({
      where: { id: depositId },
      data: {
        transfer_proof_url: proofUrl,
        status: 'pending_approval'
      },
    });

    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(deposit.amount));
    await notifyAdmins(
      'deposit_proof_uploaded',
      'Bukti Transfer NIPL Masuk',
      `${deposit.user.full_name} mengunggah bukti transfer NIPL sebesar ${formattedAmount}. Mohon diverifikasi.`,
      '/finance/deposits'
    );

    return updated;
  }
}
