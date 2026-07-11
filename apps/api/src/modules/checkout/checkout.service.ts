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

    // Grouping active NIPL
    const activeDeposits = await prisma.deposits.findMany({
      where: {
        user_id: userId,
        status: 'paid',
      }
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
            }
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
            }
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

    // 2. Consume active deposits (NIPL Deductions)
    const activeDeposits = await prisma.deposits.findMany({
      where: { user_id: userId, status: 'paid' },
      orderBy: { created_at: 'asc' }
    });

    const settingsData = await prisma.platform_settings.findMany({
      where: { key: { in: ['nipl_deposit_amount', 'nipl_motor_deposit_amount'] } }
    });
    const niplMobil = Number(settingsData.find(s => s.key === 'nipl_deposit_amount')?.value) || 5000000;
    const niplMotor = Number(settingsData.find(s => s.key === 'nipl_motor_deposit_amount')?.value) || 1000000;

    let requiredMotorValue = 0;
    let requiredMobilValue = 0;

    invoices.forEach(inv => {
      const isMotor = inv.lot.asset.category.toLowerCase().includes('motor');
      if (isMotor) {
        requiredMotorValue += niplMotor;
      } else {
        requiredMobilValue += niplMobil;
      }
    });

    let depositDeduction = new Prisma.Decimal(0);
    const consumedDepositIds: string[] = [];
    const remainderDepositsToCreate: any[] = [];

    // Helper to consume deposits by unit type
    const consumeDeposits = (deposits: any[], requiredValue: number) => {
      let remainingRequired = new Prisma.Decimal(requiredValue);
      
      for (const d of deposits) {
        if (remainingRequired.lessThanOrEqualTo(0)) break;
        
        const depositAmount = new Prisma.Decimal(d.amount);
        if (depositAmount.lessThanOrEqualTo(remainingRequired)) {
          depositDeduction = depositDeduction.add(depositAmount);
          remainingRequired = remainingRequired.minus(depositAmount);
          consumedDepositIds.push(d.id);
        } else {
          depositDeduction = depositDeduction.add(remainingRequired);
          const remainderAmount = depositAmount.minus(remainingRequired);
          remainingRequired = new Prisma.Decimal(0);
          consumedDepositIds.push(d.id);
          
          remainderDepositsToCreate.push({
            id: crypto.randomUUID(),
            user_id: d.user_id,
            session_id: d.session_id,
            amount: remainderAmount,
            gateway_fee: 0,
            transfer_fee: 0,
            refund_fee: 0,
            is_manual: d.is_manual,
            unit_type: d.unit_type,
            package_type: '1', // Remaining NIPL becomes standard (satuan) as per user rules
            va_number: d.va_number,
            va_bank: d.va_bank,
            payment_method: d.payment_method,
            status: 'paid',
            paid_at: new Date()
          });
        }
      }
    };

    consumeDeposits(activeDeposits.filter(d => d.unit_type === 'motor'), requiredMotorValue);
    consumeDeposits(activeDeposits.filter(d => d.unit_type === 'mobil'), requiredMobilValue);

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
             gateway_fee: 0,
             status: Number(grandTotal) === 0 ? 'paid' : 'unpaid',
             payment_method: paymentMethod,
             va_number: vaNumber,
             va_bank: vaBank,
             paid_at: Number(grandTotal) === 0 ? new Date() : null,
          }
       });

       // 2. Update invoices
       await tx.invoices.updateMany({
         where: { id: { in: invoiceIds } },
         data: {
            order_id: orderId,
            status: Number(grandTotal) === 0 ? 'paid' : 'pending_checkout'
         }
       });

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
            }
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
  async verifyOrder(orderId: string, status: 'paid' | 'rejected', adminId: string) {
    const order = await prisma.checkout_orders.findUnique({
      where: { id: orderId },
      include: { invoices: true }
    });

    if (!order) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Pesanan tidak ditemukan');
    }

    if (order.status !== 'pending_approval') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Pesanan ini tidak sedang menunggu verifikasi');
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
          await tx.invoices.update({
            where: { id: inv.id },
            data: { status: 'paid' }
          });
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
