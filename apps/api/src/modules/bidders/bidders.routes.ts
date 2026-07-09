import { Router } from 'express';
import { BiddersController } from './bidders.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import { applyBidderSchema, getBiddersQuerySchema, rejectBidderSchema } from './bidders.schema';

const router = Router();
const controller = new BiddersController();

// Self-service (authenticated user)
router.get('/bidders/me', authenticate, controller.getMyBidder);
router.post('/bidders/apply', authenticate, validate(applyBidderSchema), controller.apply);

// Admin
router.get(
  '/admin/bidders',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(getBiddersQuerySchema),
  controller.getBidders
);

router.get(
  '/admin/bidders/:id',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  controller.getBidderById
);

router.put(
  '/admin/bidders/:id/approve',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  controller.approve
);

router.put(
  '/admin/bidders/:id/reject',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(rejectBidderSchema),
  controller.reject
);

export default router;
