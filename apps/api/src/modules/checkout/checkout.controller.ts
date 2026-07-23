import { Request, Response, NextFunction } from 'express';
import { checkoutService } from './checkout.service';
import { sendSuccess } from '../../lib/apiResponse';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
export class CheckoutController {
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const cart = await checkoutService.getCart(userId);
      sendSuccess(res, cart, 'Data keranjang tagihan berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const orders = await checkoutService.getOrders(userId);
      sendSuccess(res, orders, 'Riwayat tagihan berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const invoices = await checkoutService.getInvoiceHistory(userId);
      sendSuccess(res, invoices, 'Riwayat tagihan berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  async processCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { invoice_ids, bank, use_nipl_invoice_ids } = req.body;
      
      const order = await checkoutService.processCheckout(userId, invoice_ids, bank || 'bca', use_nipl_invoice_ids);
      sendSuccess(res, order, 'Checkout berhasil diproses', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async uploadProof(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = req.params.id;
      const { transfer_proof_url } = req.body;
      const userId = req.user!.id;

      if (!transfer_proof_url) {
        throw new AppError(400, ErrorCode.BAD_REQUEST, 'URL bukti transfer wajib diisi');
      }

      const updatedOrder = await checkoutService.uploadProof(orderId, userId, transfer_proof_url);
      sendSuccess(res, updatedOrder, 'Bukti transfer berhasil diunggah');
    } catch (error) {
      next(error);
    }
  }

  getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await checkoutService.getAllOrders();
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  }

  verifyOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      const { status, approved_invoice_ids } = req.body; // 'paid' or 'rejected', and optional array of approved invoice IDs
      const updatedOrder = await checkoutService.verifyOrder(orderId, status, req.user!.id, approved_invoice_ids);
      sendSuccess(res, updatedOrder, 'Status pesanan berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }
}

export default CheckoutController;
