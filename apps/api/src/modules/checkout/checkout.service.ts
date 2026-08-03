import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { notifyAdmins } from '../../lib/notifyAdmins';
import { paymentsService } from '../payments/payments.service';
import { grantsUnlimitedNow } from '../../lib/niplPackage';
import { withLock } from '../../lib/mutex';

export class CheckoutService {
  /**
   * Get bidder's cart (unpaid invoices and active deposits)
   */
  async getCart(userId: string) {
    const unpaidInvoices = await prisma.invoices.findMany({
      where: {
        bidder_id: userId,
        status: { in: ['unpaid', 'pending_checkout'] },
        order_id: null,
      },
      include: {
        lot: {
          include: {
            asset: true,
            session: true,
          },
        },
      },
      orderBy: { created_at: 'desc' }
    });

    // One checkout cart is scoped to a single auction day (spec: "satu keranjang
    // checkout adalah untuk lelang satu hari") — group won lots by the date of
    // the session they were won in so the bidder pays each day's lots separately.
    const groupsByDate = new Map<string, { session_date: string; invoices: typeof unpaidInvoices; subtotal: Prisma.Decimal }>();
    for (const inv of unpaidInvoices) {
      const sessionDate = inv.lot.session.scheduled_at.toISOString().slice(0, 10);
      if (!groupsByDate.has(sessionDate)) {
        groupsByDate.set(sessionDate, { session_date: sessionDate, invoices: [], subtotal: new Prisma.Decimal(0) });
      }
      const group = groupsByDate.get(sessionDate)!;
      group.invoices.push(inv);
      group.subtotal = group.subtotal.add(inv.total);
    }
    const groups = Array.from(groupsByDate.values())
      .sort((a, b) => (a.session_date < b.session_date ? 1 : -1))
      .map((g) => ({ ...g, subtotal: Number(g.subtotal) }));

    // Grouping active NIPL — oldest first, matching the consumption order
    // processCheckout actually uses so this preview lines up with reality.
    const activeDeposits = await prisma.deposits.findMany({
      where: {
        user_id: userId,
        status: 'paid',
      },
      include: {
        nipl_codes: {
          where: { status: 'active' },
          orderBy: { created_at: 'asc' }
        }
      },
      orderBy: { created_at: 'asc' },
    });

    let totalDepositValue = new Prisma.Decimal(0);
    let hasUnlimited = false;

    activeDeposits.forEach(d => {
       totalDepositValue = totalDepositValue.add(d.amount);
       // Only an unlimited deposit still inside its activation day lifts the
       // per-NIPL cap; once the daily cron has downgraded it the bidder is
       // limited to the slots they have left.
       if (grantsUnlimitedNow(d)) hasUnlimited = true;
    });

    let totalInvoiceAmount = new Prisma.Decimal(0);
    unpaidInvoices.forEach(inv => {
      totalInvoiceAmount = totalInvoiceAmount.add(inv.total);
    });

    // Only orders still awaiting payment appear here — once the bidder has
    // uploaded transfer proof (status becomes 'pending_approval'), it drops
    // out of this section since there's nothing left for them to do but wait
    // for Admin to verify.
    const pendingOrders = await prisma.checkout_orders.findMany({
      where: {
        bidder_id: userId,
        status: 'unpaid'
      },
      include: {
        invoices: {
          include: {
            lot: {
              include: { asset: true }
            },
            nipl_codes: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return {
      invoices: unpaidInvoices,
      groups,
      active_deposits: activeDeposits.map(d => ({
        id: d.id,
        amount: Number(d.amount),
        unit_type: d.unit_type,
        package_type: d.package_type,
        unique_code: d.unique_code || 0,
        created_at: d.created_at,
        nipl_codes: d.nipl_codes.map(c => ({ id: c.id, payment_unique_code: c.payment_unique_code }))
      })),
      total_deposit_value: Number(totalDepositValue),
      total_invoice_amount: Number(totalInvoiceAmount),
      has_unlimited: hasUnlimited,
      pending_orders: pendingOrders.map((o) => ({
        ...o,
        subtotal_amount: Number(o.subtotal_amount),
        deposit_deduction: Number(o.deposit_deduction),
        final_amount: Number(o.final_amount)
      }))
    };
  }

  /**
   * Get all checkout orders (invoices history) for a bidder
   */
  async getOrders(userId: string) {
    const orders = await prisma.checkout_orders.findMany({
      where: {
        bidder_id: userId,
      },
      include: {
        invoices: {
          include: {
            lot: {
              include: {
                asset: true
              }
            },
            nipl_codes: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return orders;
  }

  /**
   * Get invoice-level payment history for a bidder (menunggu/expired/sudah dibayar).
   * Unlike getOrders(), this also surfaces invoices that expired before the bidder
   * ever started a checkout (so they never got a checkout_orders row).
   */
  async getInvoiceHistory(userId: string) {
    const invoices = await prisma.invoices.findMany({
      where: { bidder_id: userId },
      include: {
        lot: { include: { asset: true } },
        order: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return invoices;
  }

  /**
   * Alokasi jaminan NIPL per invoice dengan prinsip 1 deposit = 1 invoice:
   * setiap deposit mencakup tepat satu tagihan unit dan kode unik deposit
   * tersebut dikreditkan HANYA ke tagihan yang sama. Jika nilai deposit lebih
   * kecil dari niplValue (karena sisa saldo), deposit berikutnya ditarik untuk
   * melengkapi satu tagihan yang sama. Kode unik setiap deposit yang disentuh
   * ikut dikreditkan ke tagihan tersebut, tidak pernah "meluber" ke tagihan lain.
   *
   * Contoh: 5 NIPL (@5 jt + kode unik masing-masing) untuk 3 invoice:
   *   Invoice 1 ← Deposit 1 (5 jt + kode-unik-1) → potongan = 5 jt + kode-unik-1
   *   Invoice 2 ← Deposit 2 (5 jt + kode-unik-2) → potongan = 5 jt + kode-unik-2
   *   Invoice 3 ← Deposit 3 (5 jt + kode-unik-3) → potongan = 5 jt + kode-unik-3
   *   Deposit 4 & 5 → tetap aktif (tidak disentuh)
   */
  private allocateNiplDeductions(
    invoiceIdsOrdered: string[],
    depositsForType: Array<{
      id: string;
      amount: Prisma.Decimal;
      unique_code: number | null;
      user_id: string;
      session_id: string | null;
      is_manual: boolean | null;
      unit_type: string | null;
      va_number: string | null;
      va_bank: string | null;
      payment_method: string | null;
      nipl_codes: Array<{
        id: string;
        payment_unique_code: number;
      }>;
    }>,
    niplValue: number
  ) {
    const queue = depositsForType.map((d) => {
      const code = new Prisma.Decimal(Number(d.unique_code || 0));
      const base = new Prisma.Decimal(d.amount).minus(code);
      return { ...d, remainingBase: base, originalBase: base, code, activeCodes: [...d.nipl_codes], partiallyUsed: false };
    });

    const perInvoiceDeduction = new Map<string, Prisma.Decimal>();
    const consumedDepositIds: string[] = [];
    const remainderDepositsToCreate: any[] = [];
    const codeUpdates: Array<{ oldDepositId: string; newDepositId: string }> = [];
    const codeAssignments: Array<{ invoiceId: string; codeId: string }> = [];
    let totalDeduction = new Prisma.Decimal(0);

    for (const invoiceId of invoiceIdsOrdered) {
      let need = new Prisma.Decimal(niplValue);
      let deduction = new Prisma.Decimal(0);

      while (need.greaterThan(0) && queue.length > 0) {
        const d = queue[0];

        if (d.remainingBase.lessThanOrEqualTo(need)) {
          // Fully consumed by current invoice
          deduction = deduction.add(d.remainingBase);
          need = need.minus(d.remainingBase);
          d.remainingBase = new Prisma.Decimal(0);
          
          // Since fully consumed, use all remaining activeCodes
          let codesSum = new Prisma.Decimal(0);
          while (d.activeCodes.length > 0) {
            const popped = d.activeCodes.shift()!;
            codesSum = codesSum.add(popped.payment_unique_code);
            codeAssignments.push({ invoiceId, codeId: popped.id });
          }
          deduction = deduction.add(codesSum);
          d.code = new Prisma.Decimal(0);

          consumedDepositIds.push(d.id);
          queue.shift();
        } else {
          // Partially drains. Take exactly ONE NIPL base and ONE code, and
          // leave the deposit at the head of the queue: its remaining base
          // still belongs to this bidder and must stay available to the next
          // invoice in the same checkout. (Dropping it here meant only the
          // first unit of a multi-unit checkout ever got a NIPL deduction.)
          deduction = deduction.add(need);

          let codeToDeduct = new Prisma.Decimal(0);
          if (d.activeCodes.length > 0) {
            const popped = d.activeCodes.shift()!;
            codeToDeduct = new Prisma.Decimal(popped.payment_unique_code);
            codeAssignments.push({ invoiceId, codeId: popped.id });
          }

          deduction = deduction.add(codeToDeduct);
          d.code = d.code.minus(codeToDeduct);

          d.remainingBase = d.remainingBase.minus(need);
          need = new Prisma.Decimal(0);
          d.partiallyUsed = true;
        }
      }

      perInvoiceDeduction.set(invoiceId, deduction);
      totalDeduction = totalDeduction.add(deduction);
    }

    // Anything left in the queue that was drawn from but not exhausted gets
    // replaced by a remainder deposit carrying the untouched base and codes,
    // so the bidder keeps the NIPL slots they did not spend here.
    for (const d of queue) {
      if (!d.partiallyUsed) continue;
      consumedDepositIds.push(d.id);
      if (d.remainingBase.greaterThan(0)) {
        const newId = crypto.randomUUID();
        remainderDepositsToCreate.push({
          id: newId,
          user_id: d.user_id,
          session_id: d.session_id,
          amount: d.remainingBase.add(d.code), // base + leftover code
          gateway_fee: 0,
          transfer_fee: 0,
          refund_fee: 0,
          unique_code: Number(d.code), // leftover code sum
          is_manual: d.is_manual,
          unit_type: d.unit_type,
          package_type: Math.round(Number(d.remainingBase) / niplValue).toString(),
          va_number: d.va_number,
          va_bank: d.va_bank,
          payment_method: d.payment_method,
          status: 'paid',
          paid_at: new Date(),
        });
        codeUpdates.push({ oldDepositId: d.id, newDepositId: newId });
      }
    }

    return { perInvoiceDeduction, totalDeduction, consumedDepositIds, remainderDepositsToCreate, codeUpdates, codeAssignments };
  }


  /**
   * Kembalikan jaminan NIPL untuk satu tagihan yang batal ditagihkan, entah
   * karena seluruh order ditolak atau karena admin hanya menyetujui sebagian
   * unit di dalamnya.
   *
   * Deposit asli yang dikonsumsi saat checkout bisa saja sudah terpecah jadi
   * deposit "sisa" (lihat allocateNiplDeductions), jadi merekonstruksi deposit
   * lama itu berisiko dobel-hitung atau salah status. Sebagai gantinya kita
   * terbitkan deposit pengganti senilai persis `nipl_deduction` yang sudah
   * tercatat akurat per tagihan saat checkout — pemulihannya selalu tepat
   * nilainya, terlepas dari berapa lama proses verifikasi admin berlangsung.
   *
   * Status deposit yang bisa dipakai lagi (dibaca ulang oleh getCart dan
   * processCheckout) adalah 'paid' — BUKAN 'active'.
   */
  private async restoreNiplForInvoice(
    tx: Prisma.TransactionClient,
    bidderId: string,
    inv: { id: string; nipl_deduction: Prisma.Decimal | null; lot?: { asset?: { category?: string | null; title?: string | null } | null } | null }
  ): Promise<number> {
    const deduction = Number(inv.nipl_deduction || 0);
    if (deduction <= 0) return 0;

    const isMotor = inv.lot?.asset?.category?.toLowerCase().includes('motor');
    const unitType = isMotor ? 'motor' : 'mobil';

    const kodeLama = await tx.nipl_codes.findFirst({ where: { invoice_id: inv.id } });

    const depositPengganti = await tx.deposits.create({
      data: {
        user_id: bidderId,
        amount: new Prisma.Decimal(deduction),
        unit_type: unitType,
        // Kode unik deposit mengikuti kode NIPL yang sama, bukan disetel nol.
        unique_code: kodeLama?.payment_unique_code ?? 0,
        package_type: '1',
        is_manual: true,
        payment_method: 'nipl_refund_rejected_order',
        status: 'paid',
        paid_at: new Date(),
      },
    });

    if (kodeLama) {
      // Kode NIPL yang SAMA dipindahkan ke deposit pengganti, lalu tetap
      // disisihkan untuk tagihan yang sama.
      //
      // Kode unik harus melekat seumur hidup NIPL-nya: itulah satu-satunya
      // cara admin dan payment gateway mengenali pembayaran siapa yang masuk.
      // Menerbitkan kode baru — apalagi dengan kode unik nol — memutus jejak
      // itu dan membuat pembayaran berikutnya tidak bisa dicocokkan.
      //
      // Tetap 'reserved' karena tagihannya kembali ke keranjang: unitnya masih
      // terutang, jadi jaminannya tidak boleh lepas jadi NIPL bebas yang bisa
      // dipakai memenangkan unit lain.
      await tx.nipl_codes.update({
        where: { id: kodeLama.id },
        data: { deposit_id: depositPengganti.id, status: 'reserved', invoice_id: inv.id },
      });
    }

    // Jaminan yang berpindah tanpa kabar adalah jaminan yang dianggap hilang.
    await tx.notifications.create({
      data: {
        user_id: bidderId,
        type: 'nipl_returned',
        title: 'Jaminan NIPL Dikembalikan',
        body: `Jaminan NIPL sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(deduction)} untuk unit "${inv.lot?.asset?.title || 'lelang'}" telah dikembalikan ke akun Anda dan dapat dipakai kembali.`,
      },
    });

    return deduction;
  }

  /**
   * Process checkout
   */
  async processCheckout(userId: string, invoiceIds: string[], bank: string, useNiplInvoiceIds?: string[]) {
    if (!invoiceIds || invoiceIds.length === 0) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Pilih setidaknya satu tagihan untuk di-checkout');
    }

    // 1. Validate invoices
    const invoices = await prisma.invoices.findMany({
      where: {
        id: { in: invoiceIds },
        bidder_id: userId,
        status: 'unpaid',
      },
      include: { lot: { include: { session: true, asset: true } } },
    });

    if (invoices.length !== invoiceIds.length) {
       throw new AppError(400, ErrorCode.BAD_REQUEST, 'Beberapa tagihan tidak valid, atau sudah masuk ke order lain');
    }



    // Calculate total
    let totalInvoices = new Prisma.Decimal(0);
    invoices.forEach(inv => {
       totalInvoices = totalInvoices.add(inv.total);
    });

    // Oldest-won-unit-first so allocation is deterministic and matches the
    // order the bidder's cart preview used.
    const invoicesOrdered = [...invoices].sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

    // 2. Consume active deposits (NIPL Deductions), attributed per unit
    //
    // Kode berstatus 'reserved' ikut diambil, TAPI hanya yang disisihkan untuk
    // tagihan-tagihan yang sedang di-checkout ini. Sejak jaminan dipakai pada
    // saat menang (lihat reserveNiplForInvoice), kode untuk unit yang sedang
    // dibayar memang sudah tidak berstatus 'active' lagi — tanpa ini alokasi
    // tidak akan menemukan apa pun dan tagihannya kehilangan potongan NIPL.
    // Kode yang disisihkan untuk tagihan LAIN sengaja tidak ikut, supaya
    // jaminan satu unit tidak terpakai untuk unit yang berbeda.
    const activeDeposits = await prisma.deposits.findMany({
      where: { user_id: userId, status: 'paid' },
      include: {
        nipl_codes: {
          where: {
            OR: [
              { status: 'active' },
              { status: 'reserved', invoice_id: { in: invoiceIds } },
            ],
          },
          orderBy: { created_at: 'asc' }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    const settingsData = await prisma.platform_settings.findMany({
      where: { key: { in: ['nipl_deposit_amount', 'nipl_motor_deposit_amount'] } }
    });
    const niplMobil = Number(settingsData.find(s => s.key === 'nipl_deposit_amount')?.value) || 5000000;
    const niplMotor = Number(settingsData.find(s => s.key === 'nipl_motor_deposit_amount')?.value) || 1000000;

    const motorInvoiceIds = invoicesOrdered.filter(inv => inv.lot.asset.category.toLowerCase().includes('motor')).map(inv => inv.id);
    const mobilInvoiceIds = invoicesOrdered.filter(inv => !inv.lot.asset.category.toLowerCase().includes('motor')).map(inv => inv.id);

    const useNiplSet = new Set(useNiplInvoiceIds || invoiceIds);
    const motorInvoiceIdsWithNipl = motorInvoiceIds.filter(id => useNiplSet.has(id));
    const mobilInvoiceIdsWithNipl = mobilInvoiceIds.filter(id => useNiplSet.has(id));

    const motorAllocation = this.allocateNiplDeductions(motorInvoiceIdsWithNipl, activeDeposits.filter(d => d.unit_type === 'motor'), niplMotor);
    const mobilAllocation = this.allocateNiplDeductions(mobilInvoiceIdsWithNipl, activeDeposits.filter(d => d.unit_type === 'mobil'), niplMobil);

    const perInvoiceDeduction = new Map<string, Prisma.Decimal>([...motorAllocation.perInvoiceDeduction, ...mobilAllocation.perInvoiceDeduction]);
    const depositDeduction = motorAllocation.totalDeduction.add(mobilAllocation.totalDeduction);
    const consumedDepositIds = [...motorAllocation.consumedDepositIds, ...mobilAllocation.consumedDepositIds];
    const remainderDepositsToCreate = [...motorAllocation.remainderDepositsToCreate, ...mobilAllocation.remainderDepositsToCreate];
    const codeUpdates = [...motorAllocation.codeUpdates, ...mobilAllocation.codeUpdates];

    const codeAssignments = [...motorAllocation.codeAssignments, ...mobilAllocation.codeAssignments];

    let finalAmount = totalInvoices.minus(depositDeduction);
    if (finalAmount.lessThan(0)) {
       finalAmount = new Prisma.Decimal(0); // Cannot be negative
    }

    const orderId = crypto.randomUUID();
    // Payment gateway is disabled — there's no gateway fee to charge since
    // there's no gateway involved; the bidder always pays the invoice amount
    // net of deposit deduction, transferred manually.
    const grandTotal = finalAmount;

    let vaNumber: string | null = null;
    let vaBank: string | null = null;
    let paymentMethod: string | null = null;

    if (Number(grandTotal) > 0) {
      const settings = await prisma.platform_settings.findMany();
      vaNumber = settings.find(s => s.key === 'manual_payment_account')?.value || '0000';
      vaBank = `manual_${settings.find(s=>s.key === 'manual_payment_bank')?.value || 'bca'}`;
      paymentMethod = 'manual_transfer';
    }

    // Transaction
    const checkoutOrder = await prisma.$transaction(async (tx) => {
       // 1. Create order
       const order = await tx.checkout_orders.create({
          data: {
             id: orderId,
             bidder_id: userId,
             total_invoices: invoices.length,
             subtotal_amount: totalInvoices,
             deposit_deduction: depositDeduction,
             final_amount: grandTotal,
             unique_code: 0, // Removed unique code from checkout orders
             gateway_fee: 0,
             status: Number(grandTotal) === 0 ? 'paid' : 'unpaid',
             payment_method: paymentMethod,
             va_number: vaNumber,
             va_bank: vaBank,
             paid_at: Number(grandTotal) === 0 ? new Date() : null,
          }
       });

       // 2. Update invoices — each unit's own nipl_deduction is persisted here
       // rather than only recording the aggregate on the order.
       const invoiceStatus = Number(grandTotal) === 0 ? 'paid' : 'pending_checkout';
       await Promise.all(invoiceIds.map((id) =>
         tx.invoices.update({
           where: { id },
           data: {
             order_id: orderId,
             status: invoiceStatus,
             nipl_deduction: perInvoiceDeduction.get(id) || new Prisma.Decimal(0),
           },
         })
       ));

       // 3. Mark deposits as consumed and create remainders
       if (consumedDepositIds.length > 0) {
          await tx.deposits.updateMany({
             where: { id: { in: consumedDepositIds } },
             data: { status: 'consumed' }
          });
       }

       if (remainderDepositsToCreate.length > 0) {
          await tx.deposits.createMany({
             data: remainderDepositsToCreate
          });
       }

       if (codeUpdates.length > 0) {
         await Promise.all(codeUpdates.map(upd =>
           tx.nipl_codes.updateMany({
             where: { deposit_id: upd.oldDepositId, status: 'active' },
             data: { deposit_id: upd.newDepositId }
           })
         ));
       }

       // 4. Link the NIPL code that funded each unit's deduction so it stays
       // visible/traceable on that invoice going forward.
       if (codeAssignments.length > 0) {
         await Promise.all(codeAssignments.map((a) =>
           tx.nipl_codes.update({
             where: { id: a.codeId },
             data: { status: 'used', invoice_id: a.invoiceId },
           })
         ));
       }

       return order;
    });

    return {
      id: checkoutOrder.id,
      total_invoices: checkoutOrder.total_invoices,
      subtotal_amount: Number(checkoutOrder.subtotal_amount),
      deposit_deduction: Number(checkoutOrder.deposit_deduction),
      final_amount: Number(checkoutOrder.final_amount),
      status: checkoutOrder.status,
      payment_method: checkoutOrder.payment_method,
      va_number: checkoutOrder.va_number,
      va_bank: checkoutOrder.va_bank,
    };
  }

  /**
   * Upload transfer proof for manual payment checkout
   */
  async uploadProof(orderId: string, userId: string, proofUrl: string) {
    const order = await prisma.checkout_orders.findUnique({
      where: { id: orderId },
      include: { bidder: { select: { full_name: true } } },
    });

    if (!order) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Pesanan tidak ditemukan');
    }

    if (order.bidder_id !== userId) {
      throw new AppError(403, ErrorCode.FORBIDDEN, 'Akses ditolak');
    }

    if (order.status !== 'unpaid') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Pesanan sudah dibayar atau kedaluwarsa');
    }

    const updated = await prisma.checkout_orders.update({
      where: { id: orderId },
      data: {
        transfer_proof_url: proofUrl,
        status: 'pending_approval',
      }
    });

    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(order.final_amount));
    await notifyAdmins(
      'checkout_proof_uploaded',
      'Bukti Transfer Pelunasan Masuk',
      `${order.bidder.full_name} mengunggah bukti transfer pelunasan sebesar ${formattedAmount}. Mohon diverifikasi di Hasil Sesi.`,
      '/auction/results'
    );

    return {
      id: updated.id,
      status: updated.status,
      transfer_proof_url: updated.transfer_proof_url,
    };
  }

  /**
   * Get all checkout orders (Admin view)
   */
  async getAllOrders() {
    const orders = await prisma.checkout_orders.findMany({
      include: {
        bidder: {
          select: { full_name: true, email: true, phone: true }
        },
        invoices: {
          include: {
            lot: {
              include: { asset: true }
            },
            nipl_codes: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    return orders;
  }

  /**
   * Verify order (Admin).
   *
   * Serialised per order: the "sudah diverifikasi?" check below is a
   * read-then-write, and an admin double-clicking a slow page used to get two
   * runs through it. Now that a rejection issues replacement NIPL deposits,
   * two runs would hand the bidder their jaminan back twice.
   */
  async verifyOrder(orderId: string, status: 'paid' | 'rejected', adminId: string, approvedInvoiceIds?: string[]) {
    return withLock(`checkout-order:${orderId}`, () =>
      this.verifyOrderUnlocked(orderId, status, adminId, approvedInvoiceIds)
    );
  }

  private async verifyOrderUnlocked(orderId: string, status: 'paid' | 'rejected', adminId: string, approvedInvoiceIds?: string[]) {
    const order = await prisma.checkout_orders.findUnique({
      where: { id: orderId },
      include: {
        invoices: {
          include: { lot: { include: { asset: true } } }
        }
      }
    });

    if (!order) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Pesanan tidak ditemukan');
    }

    if (order.status !== 'pending_approval' && order.status !== 'unpaid') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Pesanan ini tidak valid untuk diverifikasi');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update order
      const updatedOrder = await tx.checkout_orders.update({
        where: { id: orderId },
        data: {
          status: status,
          paid_at: status === 'paid' ? new Date() : null,
        }
      });

      // 2. Update invoices
      if (status === 'paid') {
        for (const inv of order.invoices) {
          // If approvedInvoiceIds is undefined, we assume full approval (backward compatible)
          const isApproved = !approvedInvoiceIds || approvedInvoiceIds.includes(inv.id);
          
          if (isApproved) {
            await tx.invoices.update({
              where: { id: inv.id },
              data: { status: 'paid' }
            });
          } else {
            // Unit ini tidak disetujui: kembalikan jaminannya SEBELUM
            // nipl_deduction dinolkan, lalu lepaskan tagihannya kembali ke
            // keranjang. Tanpa langkah pertama, potongan NIPL-nya lenyap
            // begitu saja — tagihan kembali penuh sementara jaminan yang
            // sudah dipotong tidak pernah kembali ke peserta.
            await this.restoreNiplForInvoice(tx, order.bidder_id, inv);

            await tx.invoices.update({
              where: { id: inv.id },
              data: {
                status: 'unpaid',
                order_id: null,
                nipl_deduction: 0,
              }
            });
          }
        }
      } else if (status === 'rejected') {
        // Penolakan penuh: kembalikan jaminan setiap unit lebih dulu — sekali
        // nipl_deduction dinolkan, nilainya tidak bisa dibaca lagi.
        for (const inv of order.invoices) {
          await this.restoreNiplForInvoice(tx, order.bidder_id, inv);
        }

        // Semua invoice dikembalikan ke status 'unpaid' dan dilepas dari order
        // sehingga muncul kembali di keranjang bidder
        await tx.invoices.updateMany({
          where: { order_id: orderId },
          data: {
            status: 'unpaid',
            order_id: null,
            nipl_deduction: 0,
          }
        });
      }

      // 3. Log audit
      await tx.audit_logs.create({
        data: {
          user_id: adminId,
          action: `verify_checkout_${status}`,
          resource_type: 'checkout_orders',
          resource_id: orderId,
          new_value: JSON.stringify({ status_changed_to: status }),
          ip_address: 'system',
        }
      });

      return updatedOrder;
    });

    // Create or upgrade provider settlements for each approved invoice.
    // This runs OUTSIDE the $transaction because createSettlementForInvoice
    // uses the global prisma client (not tx). This mirrors the exact pattern
    // used in lots.service.markAsPaid().
    if (status === 'paid') {
      for (const inv of order.invoices) {
        const isApproved = !approvedInvoiceIds || approvedInvoiceIds.includes(inv.id);
        if (!isApproved) continue;

        const existingSettlement = await prisma.settlements.findFirst({
          where: { lot_id: inv.lot_id },
        });

        if (existingSettlement && existingSettlement.status === 'unpaid') {
          // Settlement sudah ada (dibuat saat lot terjual) tapi masih 'unpaid'
          // karena bidder belum bayar — upgrade ke 'pending' sekarang.
          await prisma.settlements.update({
            where: { id: existingSettlement.id },
            data: { status: 'pending' },
          });
        } else if (!existingSettlement) {
          // Belum ada settlement sama sekali — buat baru.
          // Invoice sudah paid (transaction commit di atas), jadi
          // createSettlementForInvoice akan menetapkan status 'pending'.
          await paymentsService.createSettlementForInvoice(inv.id);
        }
        // else: sudah 'pending' atau 'processed' — tidak perlu diubah.
      }
    }

    return updated;
  }
}

export const checkoutService = new CheckoutService();
