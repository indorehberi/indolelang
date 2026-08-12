import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { Role } from '@indo-lelang/shared-types';

const router = Router();
const controller = new PaymentsController();

// Midtrans webhook notifications (public but signature verified in controller)
router.post('/payments/webhook', controller.handleWebhook);

// Admin income ledger (staff only — providers must not see platform revenue)
router.get(
  '/payments/income',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.getIncomeLedger
);

// Provider settlements
router.get(
  '/payments/settlements',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN, Role.PROVIDER),
  controller.getSettlements
);

router.post(
  '/payments/settlements/:id/disburse',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.disburseSettlement
);

router.post(
  '/payments/settlements/:id/revert',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  controller.revertSettlement
);

// Refund queue & processing
router.get(
  '/payments/deposits/refund-queue',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.getRefundQueue
);

router.post(
  '/payments/deposits/:id/refund',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.refundDeposit
);

export default router;
