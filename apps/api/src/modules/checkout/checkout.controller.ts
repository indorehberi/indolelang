import { Request, Response, NextFunction } from 'express';
import { checkoutService } from './checkout.service';
import { sendSuccess } from '../../lib/apiResponse';

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

  async processCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { invoice_ids, bank } = req.body;
      
      const order = await checkoutService.processCheckout(userId, invoice_ids, bank || 'bca');
      sendSuccess(res, order, 'Checkout berhasil diproses', undefined, 201);
    } catch (error) {
      next(error);
    }
  }
}

export default CheckoutController;
