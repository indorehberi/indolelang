import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { xenditClient } from '../../lib/xendit';
import { logger } from '../../lib/logger';
import { Prisma } from '@prisma/client';

export class PaymentsService {
  /**
   * List provider settlements with filters and pagination
   */
  async getSettlements(
    page: number,
    perPage: number,
    status?: string,
    providerId?: string
  ): Promise<{ settlements: any[]; meta: any }> {
    const where: Prisma.settlementsWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (providerId) {
      where.provider_id = providerId;
    }

    const skip = (page - 1) * perPage;

    const [total, records] = await Promise.all([
      prisma.settlements.count({ where }),
      prisma.settlements.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
        include: {
          provider: {
            select: {
              full_name: true,
              company_name: true,
              email: true,
            },
          },
          lot: {
            include: {
              asset: {
                select: {
                  title: true,
                  category: true,
                },
              },
              session: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      settlements: records.map((r) => ({
        id: r.id,
        lot_id: r.lot_id,
        provider_id: r.provider_id,
        gross_amount: Number(r.gross_amount),
        commission_deducted: Number(r.commission_deducted),
        net_amount: Number(r.net_amount),
        status: r.status,
        transferred_at: r.transferred_at ? r.transferred_at.toISOString() : undefined,
        created_at: r.created_at.toISOString(),
        provider: r.provider,
        lot: r.lot,
      })),
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Approve and execute provider settlement disbursement via Xendit
   */
  async disburseSettlement(settlementId: string): Promise<any> {
    const settlement = await prisma.settlements.findUnique({
      where: { id: settlementId },
      include: {
        provider: true,
        lot: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!settlement) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Settlement tidak ditemukan');
    }

    if (settlement.status !== 'pending') {
      throw new AppError(
        400,
        ErrorCode.BAD_REQUEST,
        `Settlement tidak dapat diproses karena status saat ini: ${settlement.status}`
      );
    }

    try {
      // Execute the payout using the Xendit Client
      const response = await xenditClient.createDisbursement({
        externalId: `SETTLE-${settlementId}`,
        amount: Number(settlement.net_amount),
        bankCode: 'BCA', // Default bank code
        accountHolderName: settlement.provider.full_name,
        accountNumber: '1234567890', // Default dummy account number
        description: `Pelunasan lelang unit ${settlement.lot.asset.title.substring(0, 30)}`,
      });

      if (response.status === 'FAILED') {
        const failedSettle = await prisma.settlements.update({
          where: { id: settlementId },
          data: {
            status: 'failed',
          },
        });
        throw new AppError(502, 'DISBURSEMENT_FAILED', 'Disbursement ditolak oleh bank partner');
      }

      // If pending or completed, mark as transferred
      const updated = await prisma.settlements.update({
        where: { id: settlementId },
        data: {
          status: response.status === 'COMPLETED' ? 'processed' : 'pending', // map COMPLETED to processed
          transferred_at: response.status === 'COMPLETED' ? new Date() : null,
        },
      });

      return updated;
    } catch (error) {
      logger.error({ error, settlementId }, 'Disbursement exception handled');
      throw error;
    }
  }

  /**
   * Process manual or auto refund of a deposit NIPL
   */
  async refundDeposit(depositId: string): Promise<any> {
    const deposit = await prisma.deposits.findUnique({
      where: { id: depositId },
      include: {
        session: true,
        user: true,
      },
    });

    if (!deposit) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Deposit tidak ditemukan');
    }

    const eligibleStatuses = ['paid', 'pending_refund'];
    if (!eligibleStatuses.includes(deposit.status)) {
      throw new AppError(
        400,
        ErrorCode.BAD_REQUEST,
        `Deposit tidak eligible untuk refund. Status saat ini: ${deposit.status}`
      );
    }

    // Simulate refund API call. We automatically accept it and mark refunded.
    const updated = await prisma.$transaction([
      prisma.deposits.update({
        where: { id: depositId },
        data: {
          status: 'refunded',
        },
      }),
      prisma.notifications.create({
        data: {
          user_id: deposit.user_id,
          type: 'deposit_refunded',
          title: 'Refund Jaminan NIPL Selesai',
          body: `Uang jaminan deposit NIPL Sesi "${deposit.session.title}" sebesar Rp ${new Intl.NumberFormat('id-ID').format(Number(deposit.amount))} telah dikembalikan ke rekening Anda.`,
        },
      }),
      prisma.audit_logs.create({
        data: {
          action: 'REFUND_DEPOSIT',
          resource_type: 'deposit',
          resource_id: depositId,
          new_value: 'refunded',
        },
      }),
    ]);

    return updated[0];
  }

  /**
   * Get refund queue for manual approval
   */
  async getRefundQueue(page: number, perPage: number): Promise<{ queue: any[]; meta: any }> {
    const where = { status: 'pending_refund' };
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

    return {
      queue: records.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        session_id: r.session_id,
        amount: Number(r.amount),
        va_number: r.va_number || undefined,
        va_bank: r.va_bank || undefined,
        payment_method: r.payment_method || undefined,
        status: r.status,
        created_at: r.created_at.toISOString(),
        user: r.user,
        session: r.session,
      })),
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }
}

export const paymentsService = new PaymentsService();
