import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { logger } from '../../lib/logger';
import { Prisma } from '@prisma/client';
import { isUnlimitedPackage } from '../../lib/niplPackage';
import { withLock } from '../../lib/mutex';

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

export type IncomeCategory = 'fee_admin_bidder' | 'fee_lelang_provider' | 'deposit_hangus' | 'deposit' | 'biaya_admin' | 'fee_lelang';

export interface IncomeEntry {
  id?: string;
  date: Date;
  category: IncomeCategory;
  description: string;
  amount: number;
  unique_code?: number;
}

export class PaymentsService {
  /**
   * Flat ledger of everything the platform earned, newest first, for the
   * admin "Pemasukan" list.
   *  - fee_admin_bidder    — Biaya admin dari bidder yang menang lelang (Invoice paid).
   *  - fee_lelang_provider — Fee lelang dari provider (Komisi platform dari settlement).
   *  - deposit_hangus      — Deposit yang hangus (50% Admin + Kode Unik yang menyertainya).
   */
  async getIncomeLedger(
    from?: Date,
    to?: Date,
    category?: string,
    month?: number,
    year?: number
  ): Promise<IncomeEntry[]> {
    const withinRange = <T extends string>(field: T) =>
      from || to
        ? { [field]: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {};

    const [deposits, invoices, settlements] = await Promise.all([
      prisma.deposits.findMany({
        where: {
          status: { in: ['paid', 'active', 'forfeited'] },
          ...withinRange('created_at'),
        },
        select: { id: true, amount: true, unique_code: true, status: true, created_at: true, unit_type: true, package_type: true },
        orderBy: { created_at: 'desc' },
      }),
      prisma.invoices.findMany({
        where: {
          status: 'paid',
          admin_fee: { gt: 0 },
          ...withinRange('created_at'),
        },
        select: {
          id: true,
          admin_fee: true,
          created_at: true,
          lot: { select: { lot_number: true, asset: { select: { title: true } } } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.settlements.findMany({
        where: withinRange('created_at'),
        select: {
          id: true,
          commission_deducted: true,
          nipl_forfeiture_amount: true,
          net_amount: true,
          is_forfeiture: true,
          created_at: true,
          lot: { select: { lot_number: true, asset: { select: { title: true } } } },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const entries: IncomeEntry[] = [];

    // 1. Invoices -> Fee Admin dari Bidder yang Menang Lelang
    for (const inv of invoices) {
      const unitLabel = inv.lot?.asset?.title || `Lot ${inv.lot?.lot_number ?? '-'}`;
      entries.push({
        id: inv.id,
        date: inv.created_at,
        category: 'fee_admin_bidder',
        description: `Fee admin bidder — ${unitLabel}`,
        amount: Number(inv.admin_fee),
      });
    }

    // 2. Settlements -> Fee Lelang Provider / Deposit Hangus (Forfeiture)
    for (const s of settlements) {
      const unitLabel = s.lot?.asset?.title || `Lot ${s.lot?.lot_number ?? '-'}`;
      if (s.is_forfeiture) {
        const totalNipl = Number(s.nipl_forfeiture_amount || 0);
        const providerHalf = Number(s.net_amount || 0);
        const adminShare = totalNipl - providerHalf;
        if (adminShare > 0) {
          entries.push({
            id: s.id,
            date: s.created_at,
            category: 'deposit_hangus',
            description: `Deposit hangus (50% Admin) — ${unitLabel}`,
            amount: adminShare,
          });
        }
      } else {
        const comm = Number(s.commission_deducted || 0);
        if (comm > 0) {
          entries.push({
            id: s.id,
            date: s.created_at,
            category: 'fee_lelang_provider',
            description: `Fee lelang provider — ${unitLabel}`,
            amount: comm,
          });
        }
      }
    }

    // 3. Forfeited Deposits -> Deposit Hangus (50% Admin + Kode Unik)
    for (const d of deposits) {
      if (d.status === 'forfeited') {
        const totalAmount = Number(d.amount);
        const uniqueCode = Number(d.unique_code || 0);
        const baseAmount = totalAmount - uniqueCode;
        const adminHalfPlusCode = Math.floor(baseAmount / 2) + uniqueCode;
        entries.push({
          id: d.id,
          date: d.created_at,
          category: 'deposit_hangus',
          description: `Deposit hangus (50% Admin + Kode Unik Rp ${uniqueCode.toLocaleString('id-ID')}) — Ref: ${d.id.slice(0, 8)}`,
          amount: adminHalfPlusCode,
          unique_code: uniqueCode,
        });
      }
    }

    // Filter by Category, Month, Year if requested
    let filtered = entries;
    if (category) {
      filtered = filtered.filter(e => {
        if (category === 'fee_admin_bidder') return e.category === 'fee_admin_bidder' || e.category === 'biaya_admin';
        if (category === 'fee_lelang_provider') return e.category === 'fee_lelang_provider' || e.category === 'fee_lelang';
        if (category === 'deposit_hangus') return e.category === 'deposit_hangus';
        return e.category === category;
      });
    }

    if (month) {
      filtered = filtered.filter(e => e.date.getMonth() + 1 === Number(month));
    }

    if (year) {
      filtered = filtered.filter(e => e.date.getFullYear() === Number(year));
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Create a NIPL forfeiture settlement for a provider when a bidder fails to
   * pay (invoice expired). The provider receives half the base NIPL value
   * (nipl_deposit_amount from platform settings, excluding unique_code).
   * Idempotent: if a forfeiture settlement for this lot already exists, the
   * existing record is returned as-is.
   */
  async createForfeitureSettlement(lotId: string, providerId: string, niplBaseAmount: number): Promise<any> {
    const existing = await prisma.settlements.findFirst({ where: { lot_id: lotId, is_forfeiture: true } });
    if (existing) return existing;

    const halfNipl = Math.floor(niplBaseAmount / 2);

    const settlement = await prisma.settlements.create({
      data: {
        lot_id: lotId,
        provider_id: providerId,
        gross_amount: new Prisma.Decimal(0),
        commission_deducted: new Prisma.Decimal(0),
        net_amount: new Prisma.Decimal(halfNipl),
        is_forfeiture: true,
        nipl_forfeiture_amount: new Prisma.Decimal(niplBaseAmount),
        status: 'pending',
      },
    });

    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(halfNipl);
    await prisma.notifications.create({
      data: {
        user_id: providerId,
        type: 'settlement_forfeiture',
        title: 'Dana Forteit NIPL Siap Dicairkan',
        body: `Karena pemenang lelang tidak melunasi unit, Anda berhak mendapatkan setengah dari nilai jaminan NIPL sebesar ${formattedAmount}. Dana sedang diproses oleh admin.`,
      },
    });

    return settlement;
  }

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
        key: {
          in: [
            'tax_percentage', 'dpp_lain_multiplier', 'ppn_dpp_lain_percentage', 'pph23_percentage', 'pmk41_percentage',
            'default_provider_fee_type', 'commission_percentage',
          ]
        }
      }
    });
    const taxPct = parseFloat(settings.find(s => s.key === 'tax_percentage')?.value || '11.0');
    const dppLainMultiplier = parseFractionSetting(settings.find(s => s.key === 'dpp_lain_multiplier')?.value || '11/12', 11 / 12);
    const ppnDppLainPct = parseFloat(settings.find(s => s.key === 'ppn_dpp_lain_percentage')?.value || '12.0') / 100;
    const pph23Pct = parseFloat(settings.find(s => s.key === 'pph23_percentage')?.value || '2.0') / 100;
    const pmk41Pct = parseFloat(settings.find(s => s.key === 'pmk41_percentage')?.value || '1.1') / 100;
    const defaultFeeType = settings.find(s => s.key === 'default_provider_fee_type')?.value || 'percentage';
    const defaultFeeAmount = parseFloat(settings.find(s => s.key === 'commission_percentage')?.value || '1.5');

    // Fall back to the platform-wide default fee when this provider hasn't
    // had a fee individually configured on their profile — otherwise a
    // provider with no fee set silently settles at 0% commission.
    const feeType = provider.provider_fee_type ?? defaultFeeType;
    const feeAmount = provider.provider_fee_amount != null ? Number(provider.provider_fee_amount) : defaultFeeAmount;

    let totalInvoiceFeeLelang = 0;
    if (feeType === 'flat') {
      totalInvoiceFeeLelang = feeAmount;
    } else {
      totalInvoiceFeeLelang = Math.round(hammerPrice * (feeAmount / 100));
    }

    const feeDpp = Math.round(totalInvoiceFeeLelang / (1 + (taxPct / 100)));
    const feeDppLain = Math.round(feeDpp * dppLainMultiplier);
    const feePpn = Math.round(feeDppLain * ppnDppLainPct);
    const feePph23 = Math.round((totalInvoiceFeeLelang - feePpn) * pph23Pct);
    const totalTerimaFeeLelang = totalInvoiceFeeLelang - feePph23;

    // PMK 41 ditanggung SALAH SATU pihak, tidak pernah keduanya:
    //
    //   pmk41_paid_by_provider = false -> pemenang yang membayar. Nilainya
    //       ikut ditagihkan di invoice (lihat settleLot di bidding.service),
    //       dan pencairan provider tidak terpengaruh.
    //
    //   pmk41_paid_by_provider = true  -> PROVIDER yang membayar. Pemenang
    //       tidak ditagih, dan nilainya DIPOTONG dari pencairan provider.
    //
    // Sebelumnya nilai ini DITAMBAHKAN pada pencairan, sehingga provider yang
    // disetel menanggung PMK 41 justru menerima lebih banyak dan platform yang
    // menanggung bebannya — kebalikan dari maksud setelan itu.
    let pmk41 = 0;
    if (provider.pmk41_paid_by_provider) {
      pmk41 = Math.round(hammerPrice * pmk41Pct);
    }

    const netAmount = hammerPrice - totalTerimaFeeLelang - pmk41;

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
        status: invoice.status === 'paid' ? 'pending' : 'unpaid',
      },
    });

    // Create a transaction profile snapshot for the provider
    const providerUser = await prisma.users.findUnique({
      where: { id: provider.id },
      include: { kyc_document: true }
    });
    const providerDetails = await prisma.providers.findUnique({
      where: { user_id: provider.id }
    });
    if (providerUser) {
      await prisma.transaction_profiles.create({
        data: {
          transaction_id: settlement.id,
          full_name: providerUser.full_name,
          address: providerDetails?.address || provider.address || providerUser.address,
          phone: providerUser.phone,
          email: providerUser.email,
          bank_name: providerDetails?.bank_name || provider.bank_name || providerUser.bank_name,
          bank_account_no: providerDetails?.bank_account_no || provider.bank_account_no || providerUser.bank_account_no,
          bank_account_name: providerDetails?.bank_account_name || provider.bank_account_name || providerUser.bank_account_name,
          nik: providerUser.kyc_document?.nik || null,
          company_name: providerDetails?.company_name || provider.company_name || providerUser.company_name,
          npwp: providerDetails?.npwp || provider.npwp || providerUser.npwp,
        }
      });
    }

    // Provider berhak tahu unitnya laku pada saat lakunya, bukan nanti ketika
    // uangnya cair. Sebelumnya satu-satunya kabar yang ia terima adalah
    // 'settlement_disbursed' — yang baru terbit setelah admin mentransfer,
    // bisa berhari-hari kemudian. Di antara dua titik itu provider tidak punya
    // cara tahu unitnya sudah terjual, apalagi berapa yang akan ia terima.
    //
    // Nilai bersih disebutkan apa adanya berikut potongannya, supaya tidak ada
    // kejutan saat pencairan.
    const formatRp = (n: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    try {
      await prisma.notifications.create({
        data: {
          user_id: provider.id,
          type: 'lot_sold_provider',
          title: 'Unit Anda Terjual',
          body:
            `Unit "${invoice.lot.asset.title}" terjual pada harga ${formatRp(hammerPrice)}. ` +
            `Setelah dikurangi fee lelang ${formatRp(totalTerimaFeeLelang)}` +
            (pmk41 > 0 ? ` dan PMK 41 ${formatRp(pmk41)}` : '') +
            `, Anda akan menerima ${formatRp(netAmount)}. ` +
            `Dana dicairkan setelah pemenang melunasi pembayarannya.`,
          deep_link: '/provider/settlement',
        },
      });
    } catch (err) {
      // Kabar yang gagal terkirim tidak boleh membatalkan settlement yang sudah
      // tercatat benar — uangnya jauh lebih penting daripada notifikasinya.
      logger.error({ err, settlementId: settlement.id }, 'Gagal memberi tahu provider bahwa unitnya terjual');
    }

    return settlement;
  }

  /**
   * List provider settlements with filters and pagination
   */
  async getSettlements(
    page: number,
    perPage: number,
    status?: string,
    providerId?: string,
    from?: Date,
    to?: Date,
    winnerId?: string
  ): Promise<{ settlements: any[]; meta: any }> {
    const where: Prisma.settlementsWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (providerId) {
      where.provider_id = providerId;
    }
    if (winnerId) {
      where.lot = {
        bids: {
          some: {
            bidder_id: winnerId,
            is_winning: true,
          },
        },
      };
    }
    if (from || to) {
      where.created_at = {};
      if (from) (where.created_at as any).gte = from;
      if (to) {
        // Include the entire 'to' day
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        (where.created_at as any).lte = toEnd;
      }
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
                  id: true,
                  title: true,
                  category: true,
                  police_number: true,
                  year: true,
                },
              },
              session: {
                select: {
                  id: true,
                  title: true,
                  scheduled_at: true,
                  created_at: true,
                },
              },
              // Biaya administrasi hidup di invoice, bukan di settlement.
              // Tanpa ini laporan keuangan tidak punya cara membaca angka yang
              // BENAR-BENAR ditagihkan, dan sebelumnya halaman laporan
              // mengarang sendiri lewat tabel yang dipatok mati di kode.
              invoices: {
                select: { admin_fee: true, total: true, pmk41_amount: true, status: true },
                take: 1,
              },
              // Pemenang lelang: ambil bid pemenang di lot ini
              bids: {
                where: { is_winning: true },
                select: {
                  id: true,
                  bidder: {
                    select: {
                      id: true,
                      full_name: true,
                      email: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
      }),
    ]) as [number, any[]];

    const recordIds = records.map(r => r.id);
    const txProfiles = await prisma.transaction_profiles.findMany({
      where: { transaction_id: { in: recordIds } }
    });
    const txProfilesMap = new Map(txProfiles.map(p => [p.transaction_id, p]));

    return {
      settlements: records.map((r) => {
        const txProfile = txProfilesMap.get(r.id);
        return {
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
          // Biaya administrasi yang BENAR-BENAR ditagihkan ke pemenang, dibaca
          // dari invoice lot ini — bukan dihitung ulang oleh layar mana pun.
          admin_fee: Number(r.lot?.invoices?.[0]?.admin_fee || 0),
          provider: {
            ...r.provider,
            full_name: txProfile?.full_name ?? r.provider.full_name,
            company_name: txProfile?.company_name ?? r.provider.company_name,
            // Rekening tujuan diambil dari potret data saat transaksi dibuat,
            // supaya riwayat pencairan tidak ikut berubah kalau provider
            // mengganti rekeningnya belakangan.
            bank_name: txProfile?.bank_name ?? null,
            bank_account_no: txProfile?.bank_account_no ?? null,
            bank_account_name: txProfile?.bank_account_name ?? null,
          },
          lot: r.lot,
          winner: r.lot?.bids?.[0]?.bidder ?? null,
        };
      }),
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
    return withLock(`settlement:${settlementId}`, () => this.disburseSettlementUnlocked(settlementId));
  }

  private async disburseSettlementUnlocked(settlementId: string): Promise<any> {
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

    // Forfeiture settlements can be disbursed the same way as normal settlements
    // — the admin manually transfers the half-NIPL amount to the provider.

    const updated = await prisma.settlements.update({
      where: { id: settlementId },
      data: {
        status: 'processed',
        transferred_at: new Date(),
        gateway_fee: 0,
      },
    });

    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(settlement.net_amount));
    const notifTitle = settlement.is_forfeiture ? 'Dana Forteit NIPL Terkirim' : 'Dana Pencairan Terkirim';
    const notifBody = settlement.is_forfeiture
      ? `Dana jaminan NIPL forteit (½ nilai NIPL) untuk unit "${settlement.lot.asset.title}" sebesar ${formattedAmount} telah ditransfer ke rekening Anda.`
      : `Dana hasil penjualan unit "${settlement.lot.asset.title}" sebesar ${formattedAmount} telah ditransfer ke rekening Anda.`;

    await prisma.notifications.create({
      data: {
        user_id: settlement.provider_id,
        type: settlement.is_forfeiture ? 'settlement_forfeiture_disbursed' : 'settlement_disbursed',
        title: notifTitle,
        body: notifBody,
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
    return withLock(`deposit:${depositId}`, () => this.refundDepositUnlocked(depositId));
  }

  private async refundDepositUnlocked(depositId: string): Promise<any> {
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

    // Menghanguskan jaminan orang adalah tindakan yang tidak bisa ditarik
    // kembali, jadi dua syarat harus terpenuhi lebih dulu.
    //
    // Syarat 1 — deposit ini harus benar-benar terikat pada sebuah sesi.
    //   Sebelumnya penyaring sesi ditulis `session_id: deposit.session_id ||
    //   undefined`. Untuk deposit umum yang tidak terikat sesi, Prisma
    //   MEMBUANG penyaring bernilai undefined — sehingga pemeriksaannya
    //   melebar ke SELURUH sesi yang pernah ada, dan tunggakan lama yang tidak
    //   ada hubungannya bisa menghanguskan deposit yang bersih.
    //
    // Syarat 2 — deposit harus punya kode NIPL yang benar-benar dipakai.
    //   Jaminan tanpa kode NIPL tidak pernah dipertaruhkan di lelang mana pun,
    //   jadi tidak ada dasar untuk menghanguskannya.
    if (deposit.session_id) {
      const overdueInvoices = await prisma.invoices.count({
        where: {
          bidder_id: deposit.user_id,
          status: 'overdue',
          lot: { session_id: deposit.session_id },
        },
      });

      const niplCodeCount = await prisma.nipl_codes.count({
        where: { deposit_id: deposit.id },
      });

      if (overdueInvoices > 0 && niplCodeCount > 0) {
        await prisma.deposits.update({
          where: { id: depositId },
          data: { status: 'forfeited' },
        });
        throw new AppError(
          400,
          ErrorCode.BAD_REQUEST,
          'Refund ditolak. Deposit (NIPL) ini hangus karena Anda memiliki tagihan pelunasan lelang yang tidak dibayar (Overdue) pada sesi ini.'
        );
      }

      if (overdueInvoices > 0) {
        // Ada tunggakan, tapi deposit ini tidak memegang kode NIPL apa pun —
        // jangan hanguskan, cukup tahan refundnya untuk ditinjau admin.
        logger.warn(
          { depositId, userId: deposit.user_id, sessionId: deposit.session_id },
          'Refund ditahan: bidder punya tagihan overdue, tetapi deposit ini tidak memiliki nipl_codes sehingga tidak dihanguskan'
        );
        throw new AppError(
          400,
          ErrorCode.BAD_REQUEST,
          'Refund belum dapat diproses karena Anda masih memiliki tagihan pelunasan yang jatuh tempo pada sesi ini. Silakan hubungi admin.'
        );
      }
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
              address: true,
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
        unit_type: r.unit_type || undefined,
        package_type: r.package_type || undefined,
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
