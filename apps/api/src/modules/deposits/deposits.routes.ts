import { Router } from 'express';
import { DepositsController } from './deposits.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import { createDepositSchema, getDepositsQuerySchema } from './deposits.schema';

const router = Router();
const controller = new DepositsController();

// Create NIPL deposit VA (Bidder only)
router.post(
  '/deposits/create',
  authenticate,
  authorize(Role.BIDDER),
  validate(createDepositSchema),
  controller.createDeposit
);

// View list of deposits (Bidder sees own history, Admin/Operator sees all)
router.get(
  '/deposits',
  authenticate,
  validate(getDepositsQuerySchema),
  controller.getDeposits
);

// Request Refund NIPL (Bidder only)
router.post(
  '/deposits/:id/request-refund',
  authenticate,
  authorize(Role.BIDDER),
  controller.requestRefund
);

// Mark Manual Deposit as Paid (Admin only)
router.put(
  '/deposits/:id/mark-paid',
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  controller.markAsPaid
);

export default router;
