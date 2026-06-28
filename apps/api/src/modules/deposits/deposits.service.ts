import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { logger } from '../../lib/logger';
import { ErrorCode } from '@indo-lelang/utils';
import { DepositDTO, PaginationMeta, DepositStatus, Role } from '@indo-lelang/shared-types';
import { midtransClient } from '../../lib/midtrans';
import { sendEmail } from '../../lib/email';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

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
    sessionId: string,
    amount: number,
    bank: 'bca' | 'mandiri' | 'bni' | 'bri' | 'permata'
  ): Promise<DepositDTO> {
    // 1. Verify user exists and is a bidder
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, ErrorCode.USER_NOT_FOUND, 'User tidak ditemukan');
    }

    // 2. Verify session exists and is not closed
    const session = await prisma.auction_sessions.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Sesi lelang tidak ditemukan');
    }

    if (session.status === 'closed') {
      throw new AppError(
        400,
        ErrorCode.BAD_REQUEST,
        'Tidak dapat mendaftar NIPL untuk sesi lelang yang sudah ditutup'
      );
    }

    // 3. Check if user already has an active (paid) NIPL/deposit for this session
    const existingActive = await prisma.deposits.findFirst({
      where: {
        user_id: userId,
        session_id: sessionId,
        status: DepositStatus.PAID,
      },
    });

    if (existingActive) {
      throw new AppError(
        400,
        ErrorCode.BAD_REQUEST,
        'Anda sudah memiliki NIPL aktif untuk sesi lelang ini'
      );
    }

    // Generate deposit record ID beforehand to use as Midtrans order ID
    const depositId = crypto.randomUUID();
    const orderId = `NIPL-${depositId}`;

    // 4. Request Midtrans for VA details
    const midtransRes = await midtransClient.chargeVirtualAccount({
      orderId,
      amount,
      bank,
    });

    // 5. Expire any old pending deposits for the same session and user
    await prisma.deposits.updateMany({
      where: {
        user_id: userId,
        session_id: sessionId,
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
        session_id: sessionId,
        amount: new Prisma.Decimal(amount),
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

    sendEmail({
      to: user.email,
      subject: `[Indo-Lelang] Pembayaran NIPL Sesi ${session.title}`,
      text: `Halo ${user.full_name},\n\nAnda telah mengajukan pendaftaran NIPL untuk sesi lelang "${session.title}". Silakan lakukan pembayaran deposit sebesar ${formattedAmount} melalui bank ${bank.toUpperCase()} Virtual Account.\n\nNomor VA: ${midtransRes.va_number}\nStatus: Menunggu Pembayaran (Berlaku 60 menit)\n\nTerima kasih,\nTim Indo-Lelang`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2b6cb0;">Pendaftaran NIPL Indo-Lelang</h2>
          <p>Halo <strong>${user.full_name}</strong>,</p>
          <p>Anda telah mengajukan pendaftaran NIPL untuk sesi lelang <strong>"${session.title}"</strong>.</p>
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #718096;">Jumlah Jaminan:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #2d3748;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">Metode Pembayaran:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #2d3748;">Virtual Account ${bank.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">Nomor Virtual Account:</td>
                <td style="padding: 6px 0; font-size: 1.2rem; font-weight: bold; color: #e53e3e;">${midtransRes.va_number}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">Status:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #dd6b20;">Menunggu Pembayaran</td>
              </tr>
            </table>
          </div>
          <p style="color: #718096; font-size: 0.9rem;">Catatan: Virtual Account ini berlaku selama 60 menit. Harap segera melakukan transfer sebelum batas waktu berakhir.</p>
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
      session_id: deposit.session_id,
      amount: Number(deposit.amount),
      va_number: deposit.va_number || undefined,
      va_bank: deposit.va_bank || undefined,
      payment_method: deposit.payment_method || undefined,
      status: deposit.status,
      paid_at: deposit.paid_at ? deposit.paid_at.toISOString() : undefined,
      created_at: deposit.created_at.toISOString(),
    };
  }
}
