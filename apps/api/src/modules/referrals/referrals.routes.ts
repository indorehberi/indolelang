import { Router } from 'express';
import ReferralsController from './referrals.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { Role } from '@indo-lelang/shared-types';

const router = Router();
const controller = new ReferralsController();

// Admin endpoints
router.get(
  '/admin/referrals',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  controller.getAdminReferrals
);

// Bidder endpoints
router.get(
  '/referrals/me',
  authenticate,
  authorize(Role.BIDDER),
  controller.getMyReferral
);

router.post(
  '/referrals/generate',
  authenticate,
  authorize(Role.BIDDER),
  controller.generateReferral
);

export default router;
