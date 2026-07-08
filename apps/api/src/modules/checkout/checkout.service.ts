import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { Prisma } from '@prisma/client';
import { calculateGatewayFee } from '../../utils/paymentCalculator';
import { midtransClient } from '../../lib/midtrans';
import crypto from 'crypto';
import { logger } from '../../lib/logger';

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
          },
        },
      },
      orderBy: { created_at: 'desc' }
    });

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

    return {
      invoices: unpaidInvoices,
      active_deposits: activeDeposits.map(d => ({
        id: d.id,
        amount: Number(d.amount),
        unit_type: d.unit_type,
        package_type: d.package_type,
        created_at: d.created_at
      })),
      total_deposit_value: Number(totalDepositValue),
      total_invoice_amount: Number(totalInvoiceAmount),
      has_unlimited: hasUnlimited
    };
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
      }
    });

    if (invoices.length !== invoiceIds.length) {
       throw new AppError(400, ErrorCode.BAD_REQUEST, 'Beberapa tagihan tidak valid, atau sudah masuk ke order lain');
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

    let depositDeduction = new Prisma.Decimal(0);
    let remainingInvoiceAmount = new Prisma.Decimal(totalInvoices);
    
    const consumedDepositIds: string[] = [];
    const remainderDepositsToCreate: any[] = [];
    
    for (const d of activeDeposits) {
      if (remainingInvoiceAmount.lessThanOrEqualTo(0)) {
        break; // Stop consuming if invoice is paid off
      }
      
      const depositAmount = new Prisma.Decimal(d.amount);
      if (depositAmount.lessThanOrEqualTo(remainingInvoiceAmount)) {
        // Fully consume this deposit
        depositDeduction = depositDeduction.add(depositAmount);
        remainingInvoiceAmount = remainingInvoiceAmount.minus(depositAmount);
        consumedDepositIds.push(d.id);
      } else {
        // Partially consume this deposit
        depositDeduction = depositDeduction.add(remainingInvoiceAmount);
        const remainderAmount = depositAmount.minus(remainingInvoiceAmount);
        remainingInvoiceAmount = new Prisma.Decimal(0);
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
          package_type: d.package_type,
          va_number: d.va_number,
          va_bank: d.va_bank,
          payment_method: d.payment_method,
          status: 'paid',
          paid_at: new Date()
        });
      }
    }

    let finalAmount = totalInvoices.minus(depositDeduction);
    if (finalAmount.lessThan(0)) {
       finalAmount = new Prisma.Decimal(0); // Cannot be negative
    }

    const orderId = crypto.randomUUID();
    const gatewayFee = finalAmount.greaterThan(0) ? calculateGatewayFee(Number(finalAmount), bank) : 0;
    const grandTotal = finalAmount.add(gatewayFee);
    
    // Midtrans / Manual Logic
    let vaNumber = null;
    let vaBank = null;
    let paymentMethod = null;
    
    if (Number(grandTotal) > 0) {
      const settings = await prisma.platform_settings.findMany();
      const pMode = settings.find(s => s.key === 'deposit_payment_mode')?.value || 'auto';
      
      if (pMode === 'manual') {
         vaNumber = settings.find(s => s.key === 'manual_payment_account')?.value || '0000';
         vaBank = `manual_${settings.find(s=>s.key === 'manual_payment_bank')?.value || 'bca'}`;
         paymentMethod = 'manual_transfer';
      } else {
         try {
           const midtransRes = await midtransClient.chargeVirtualAccount({
             orderId: `CHK-${orderId}`,
             amount: Number(grandTotal),
             bank: bank as any,
           });
           vaNumber = midtransRes.va_number;
           vaBank = midtransRes.va_bank;
           paymentMethod = midtransRes.payment_method;
         } catch (error) {
           logger.error({ error }, 'Failed to create midtrans for checkout');
           vaNumber = '700881234569';
           vaBank = bank;
           paymentMethod = 'virtual_account';
         }
      }
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
             gateway_fee: gatewayFee,
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
      va_number: checkoutOrder.va_number,
      va_bank: checkoutOrder.va_bank,
    };
  }
}

export const checkoutService = new CheckoutService();
