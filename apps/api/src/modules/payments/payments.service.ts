import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { logger } from '../../lib/logger';
import { Prisma } from '@prisma/client';

/**
 * Parse a settings value that may be a plain number or a "a/b" fraction
 * (e.g. the default dpp_lain_multiplier "11/12"), without eval().
 */
function parseFractionSetting(value: string, fallback: number): number {
  const parts = value.split('/');
  if (parts.length === 2) {
    const num = Number(parts[0]);
    const den = Number(parts[1]);
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) {
      return num / den;
    }
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export class PaymentsService {
  /**
   * Compute and persist the provider settlement (pencairan) for a sold lot's
   * invoice. Shared by the Midtrans webhook path and the manual "tandai
   * lunas" admin action, so both produce the same numbers. Idempotent: if a
   * settlement already exists for this lot, it's returned as-is.
   */
  async createSettlementForInvoice(invoiceId: string): Promise<any> {
    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        lot: {
          include: {
            asset: { include: { provider: true } },
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Invoice tidak ditemukan');
    }

    const existing = await prisma.settlements.findFirst({ where: { lot_id: invoice.lot_id } });
    if (existing) return existing;

    const hammerPrice = Number(invoice.hammer_price);
    const provider = invoice.lot.asset.provider;

    const settings = await prisma.platform_settings.findMany({
      where: {
        key: { in: ['tax_percentage', 'dpp_lain_multiplier', 'ppn_dpp_lain_percentage', 'pph23_percentage', 'pmk41_percentage'] }
      }
    });
    const taxPct = parseFloat(settings.find(s => s.key === 'tax_percentage')?.value || '11.0');
    const dppLainMultiplier = parseFractionSetting(settings.find(s => s.key === 'dpp_lain_multiplier')?.value || '11/12', 11 / 12);
    const ppnDppLainPct = parseFloat(settings.find(s => s.key === 'ppn_dpp_lain_percentage')?.value || '12.0') / 100;
    const pph23Pct = parseFloat(settings.find(s => s.key === 'pph23_percentage')?.value || '2.0') / 100;
    const pmk41Pct = parseFloat(settings.find(s => s.key === 'pmk41_percentage')?.value || '1.1') / 100;

    let totalInvoiceFeeLelang = 0;
    if (provider.provider_fee_type === 'flat') {
      totalInvoiceFeeLelang = Number(provider.provider_fee_amount || 0);
    } else {
      const percentage = Number(provider.provider_fee_amount || 0) / 100;
      totalInvoiceFeeLelang = Math.round(hammerPrice * percentage);
    }

    const feeDpp = Math.round(totalInvoiceFeeLelang / (1 + (taxPct / 100)));
    const feeDppLain = Math.round(feeDpp * dppLainMultiplier);
    const feePpn = Math.round(feeDppLain * ppnDppLainPct);
    const feePph23 = Math.round((totalInvoiceFeeLelang - feePpn) * pph23Pct);
    const totalTerimaFeeLelang = totalInvoiceFeeLelang - feePph23;

    // Kept as-is per client confirmation: PMK41 is added, not subtracted,
    // when a provider is configured to bear it themselves.
    let pmk41 = 0;
    if (provider.pmk41_paid_by_provider) {
      pmk41 = Math.round(hammerPrice * pmk41Pct);
    }

    const netAmount = hammerPrice - totalTerimaFeeLelang + pmk41;

    const settlement = await prisma.settlements.create({
      data: {
        lot_id: invoice.lot_id,
        provider_id: provider.id,
        gross_amount: new Prisma.Decimal(hammerPrice),
        commission_deducted: new Prisma.Decimal(totalTerimaFeeLelang),
        net_amount: new Prisma.Decimal(netAmount),
        fee_dpp: new Prisma.Decimal(feeDpp),
        fee_dpp_lain: new Prisma.Decimal(feeDppLain),
        fee_ppn: new Prisma.Decimal(feePpn),
        fee_pph23: new Prisma.Decimal(feePph23),
        pmk41_amount: new Prisma.Decimal(pmk41),
        status: 'pending',
      },
    });

    return settlement;
  }

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
        fee_dpp: Number(r.fee_dpp || 0),
        fee_dpp_lain: Number(r.fee_dpp_lain || 0),
        fee_ppn: Number(r.fee_ppn || 0),
        fee_pph23: Number(r.fee_pph23 || 0),
        pmk41_amount: Number(r.pmk41_amount || 0),
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
   * Mark a provider settlement as disbursed. Payment gateway is disabled —
   * the admin transfers the net_amount to the provider's bank account
   * manually outside the system, then calls this to record it as done.
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

    const updated = await prisma.settlements.update({
      where: { id: settlementId },
      data: {
        status: 'processed',
        transferred_at: new Date(),
        gateway_fee: 0,
      },
    });

    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(settlement.net_amount));
    await prisma.notifications.create({
      data: {
        user_id: settlement.provider_id,
        type: 'settlement_disbursed',
        title: 'Dana Pencairan Terkirim',
        body: `Dana hasil penjualan unit "${settlement.lot.asset.title}" sebesar ${formattedAmount} telah ditransfer ke rekening Anda.`,
      },
    });

    await prisma.audit_logs.create({
      data: {
        action: 'DISBURSE_SETTLEMENT',
        resource_type: 'settlement',
        resource_id: settlementId,
        new_value: 'processed',
      },
    });

    return updated;
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

    // Validation to prevent refunding deposits if the user won a lot but failed to pay (NIPL forfeit).
    // We check if the user has any overdue invoices in the same session.
    const overdueInvoices = await prisma.invoices.count({
      where: {
        bidder_id: deposit.user_id,
        status: 'overdue',
        lot: {
          session_id: deposit.session_id || undefined
        }
      }
    });

    if (overdueInvoices > 0) {
      // System logic: Forfeit this 1 NIPL (mark as forfeited) and reject refund
      await prisma.deposits.update({
        where: { id: depositId },
        data: { status: 'forfeited' }
      });
      throw new AppError(
        400,
        ErrorCode.BAD_REQUEST,
        'Refund ditolak. Deposit (NIPL) ini hangus karena Anda memiliki tagihan pelunasan lelang yang tidak dibayar (Overdue) pada sesi ini.'
      );
    }

    try {
      // Payment gateway is disabled — refunds are always manual transfer.
      // We assume the Admin has transferred the money manually before
      // clicking this button; this call just records that fact.
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
            body: `Uang jaminan deposit NIPL Sesi "${deposit.session?.title || 'Umum'}" sebesar Rp ${new Intl.NumberFormat('id-ID').format(Number(deposit.amount))} telah dikembalikan ke rekening Anda.`,
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
    } catch (error) {
      logger.error({ error, depositId }, 'Refund exception handled');
      throw error;
    }
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
              bank_name: true,
              bank_account_no: true,
              bank_account_name: true,
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
