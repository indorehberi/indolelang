import { Router } from 'express';
import CheckoutController from './checkout.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { Role } from '@indo-lelang/shared-types';

const router = Router();
const controller = new CheckoutController();

router.get(
  '/cart',
  authenticate,
  authorize(Role.BIDDER),
  controller.getCart
);

router.get(
  '/orders',
  authenticate,
  authorize(Role.BIDDER),
  controller.getOrders
);

router.get(
  '/invoices',
  authenticate,
  authorize(Role.BIDDER),
  controller.getInvoiceHistory
);

router.post(
  '/checkout',
  authenticate,
  authorize(Role.BIDDER),
  controller.processCheckout
);

router.post(
  '/:id/proof',
  authenticate,
  authorize(Role.BIDDER),
  controller.uploadProof
);

export default router;
