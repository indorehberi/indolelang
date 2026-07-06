import { Router } from 'express';
import { ControlController } from './control.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { Role } from '@indo-lelang/shared-types';

const router = Router();
const controller = new ControlController();

// Admin / Operator live bidding control room endpoints
router.post(
  '/admin/lots/:id/activate',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.activateLot
);

router.post(
  '/admin/lots/:id/close',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.closeLot
);

router.post(
  '/admin/lots/:id/cancel',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.cancelLot
);

router.post(
  '/admin/sessions/:id/end',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.endSession
);

export default router;
