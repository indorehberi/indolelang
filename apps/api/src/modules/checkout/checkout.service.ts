import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { notifyAdmins } from '../../lib/notifyAdmins';

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
      orderBy: { created_at: 'asc' },
    });

    let totalDepositValue = new Prisma.Decimal(0);
    let hasUnlimited = false;

    activeDeposits.forEach(d => {
       totalDepositValue = totalDepositValue.add(d.amount);
       if (d.package_type === 'unlimited') hasUnlimited = true;
    });

    let totalInvoiceAmount = new Prisma.Decimal(0);
    unpaidInvoices.forEach(inv => {
      totalInvoiceAmount = totalInvoiceAmount.add(inv.total);
    });

    const pendingOrders = await prisma.checkout_orders.findMany({
      where: {
        bidder_id: userId,
        status: { in: ['unpaid', 'pending_approval'] }
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
        created_at: d.created_at
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
   * Greedily draw `niplValue` worth of guarantee per invoice (oldest invoice
   * first) from an ordered (oldest-first) deposits queue shared across all of
   * them. A deposit's unique_code is spent in full the moment the deposit is
   * first touched — whether that consumption drains it completely or only
   * partially — matching how the money side has always worked; only the
   * trailing, not-fully-drained deposit (if any) survives as a fresh,
   * code-free remainder once every invoice's requirement has been filled.
   * This makes the total deduction identical to the old aggregate algorithm
   * while additionally attributing an exact amount to each invoice.
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
    }>,
    niplValue: number
  ) {
    const queue = depositsForType.map((d) => {
      const code = new Prisma.Decimal(Number(d.unique_code || 0));
      const base = new Prisma.Decimal(d.amount).minus(code);
      return { ...d, remainingBase: base, originalBase: base, code };
    });

    const perInvoiceDeduction = new Map<string, Prisma.Decimal>();
    const consumedDepositIds: string[] = [];
    let totalDeduction = new Prisma.Decimal(0);

    for (const invoiceId of invoiceIdsOrdered) {
      let need = new Prisma.Decimal(niplValue);
      let deduction = new Prisma.Decimal(0);

      while (need.greaterThan(0) && queue.length > 0) {
        const d = queue[0];
        if (d.remainingBase.lessThanOrEqualTo(need)) {
          deduction = deduction.add(d.remainingBase);
          need = need.minus(d.remainingBase);
          d.remainingBase = new Prisma.Decimal(0);
          if (d.code.greaterThan(0)) {
            deduction = deduction.add(d.code);
            d.code = new Prisma.Decimal(0);
          }
          consumedDepositIds.push(d.id);
          queue.shift();
        } else {
          deduction = deduction.add(need);
          if (d.code.greaterThan(0)) {
            deduction = deduction.add(d.code);
            d.code = new Prisma.Decimal(0);
          }
          d.remainingBase = d.remainingBase.minus(need);
          need = new Prisma.Decimal(0);
        }
      }

      perInvoiceDeduction.set(invoiceId, deduction);
      totalDeduction = totalDeduction.add(deduction);
    }

    // Close out a trailing partially-drained deposit: mark it consumed and
    // spawn a fresh, code-free remainder for whatever base value is left.
    const remainderDepositsToCreate: any[] = [];
    const codeUpdates: Array<{ oldDepositId: string; newDepositId: string }> = [];
    if (queue.length > 0) {
      const d = queue[0];
      if (d.remainingBase.lessThan(d.originalBase)) {
        consumedDepositIds.push(d.id);
        if (d.remainingBase.greaterThan(0)) {
          const newId = crypto.randomUUID();
          remainderDepositsToCreate.push({
            id: newId,
            user_id: d.user_id,
            session_id: d.session_id,
            amount: d.remainingBase,
            gateway_fee: 0,
            transfer_fee: 0,
            refund_fee: 0,
            unique_code: 0,
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
    }

    return { perInvoiceDeduction, totalDeduction, consumedDepositIds, remainderDepositsToCreate, codeUpdates };
  }

  /**
   * Process checkout
   */
  async processCheckout(userId: string, invoiceIds: string[], bank: string) {
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

    // A checkout order is scoped to a single auction day — reject attempts to
    // combine lots won on different session dates into one order.
    const sessionDates = new Set(invoices.map((inv) => inv.lot.session.scheduled_at.toISOString().slice(0, 10)));
    if (sessionDates.size > 1) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Tagihan yang dipilih berasal dari sesi lelang yang berbeda hari. Selesaikan pembayaran per hari lelang.');
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
    const activeDeposits = await prisma.deposits.findMany({
      where: { user_id: userId, status: 'paid' },
      orderBy: { created_at: 'asc' }
    });

    const settingsData = await prisma.platform_settings.findMany({
      where: { key: { in: ['nipl_deposit_amount', 'nipl_motor_deposit_amount'] } }
    });
    const niplMobil = Number(settingsData.find(s => s.key === 'nipl_deposit_amount')?.value) || 5000000;
    const niplMotor = Number(settingsData.find(s => s.key === 'nipl_motor_deposit_amount')?.value) || 1000000;

    const motorInvoiceIds = invoicesOrdered.filter(inv => inv.lot.asset.category.toLowerCase().includes('motor')).map(inv => inv.id);
    const mobilInvoiceIds = invoicesOrdered.filter(inv => !inv.lot.asset.category.toLowerCase().includes('motor')).map(inv => inv.id);

    const motorAllocation = this.allocateNiplDeductions(motorInvoiceIds, activeDeposits.filter(d => d.unit_type === 'motor'), niplMotor);
    const mobilAllocation = this.allocateNiplDeductions(mobilInvoiceIds, activeDeposits.filter(d => d.unit_type === 'mobil'), niplMobil);

    const perInvoiceDeduction = new Map<string, Prisma.Decimal>([...motorAllocation.perInvoiceDeduction, ...mobilAllocation.perInvoiceDeduction]);
    const depositDeduction = motorAllocation.totalDeduction.add(mobilAllocation.totalDeduction);
    const consumedDepositIds = [...motorAllocation.consumedDepositIds, ...mobilAllocation.consumedDepositIds];
    const remainderDepositsToCreate = [...motorAllocation.remainderDepositsToCreate, ...mobilAllocation.remainderDepositsToCreate];
    const codeUpdates = [...motorAllocation.codeUpdates, ...mobilAllocation.codeUpdates];

    // 3. Assign one traceable NIPL code per unit that actually drew a
    // deduction, oldest active code first — decoupled from the money-side
    // remainder splitting above so it stays correct even if a legacy deposit
    // (purchased before codes existed) has no linked codes to give out.
    const codeInvoiceIds = invoicesOrdered.filter(inv => (perInvoiceDeduction.get(inv.id) || new Prisma.Decimal(0)).greaterThan(0)).map(inv => ({
      id: inv.id,
      unitType: inv.lot.asset.category.toLowerCase().includes('motor') ? 'motor' : 'mobil',
    }));
    const availableCodes = codeInvoiceIds.length > 0
      ? await prisma.nipl_codes.findMany({
          where: {
            status: 'active',
            unit_type: { in: [...new Set(codeInvoiceIds.map(c => c.unitType))] },
            deposit: { user_id: userId, status: 'paid' },
          },
          orderBy: { created_at: 'asc' },
        })
      : [];
    const codeAssignments: Array<{ invoiceId: string; codeId: string }> = [];
    for (const inv of codeInvoiceIds) {
      const idx = availableCodes.findIndex(c => c.unit_type === inv.unitType);
      if (idx === -1) continue;
      const [code] = availableCodes.splice(idx, 1);
      codeAssignments.push({ invoiceId: inv.id, codeId: code.id });
    }

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
   * Verify order (Admin)
   */
  async verifyOrder(orderId: string, status: 'paid' | 'rejected', adminId: string, approvedInvoiceIds?: string[]) {
    const order = await prisma.checkout_orders.findUnique({
      where: { id: orderId },
      include: { invoices: true }
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
            // Detach rejected invoices so they become unpaid and outstanding again
            await tx.invoices.update({
              where: { id: inv.id },
              data: { 
                status: 'unpaid',
                order_id: null 
              }
            });
          }
        }
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

    return updated;
  }
}

export const checkoutService = new CheckoutService();
