import { Router } from 'express';
import { KycController } from './kyc.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import {
  uploadKycSchema,
  rejectKycSchema,
  kycQueueQuerySchema,
} from './kyc.schema';

const router = Router();
const controller = new KycController();

// Bidder & Provider KYC routes
router.post(
  '/kyc/upload-documents',
  authenticate,
  validate(uploadKycSchema),
  controller.uploadDocuments
);

router.get('/kyc/status', authenticate, controller.getKycStatus);
router.post('/kyc/auto-verify', authenticate, controller.autoVerify);

// Admin & Operator KYC review endpoints
router.get(
  '/admin/kyc/queue',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  validate(kycQueueQuerySchema),
  controller.getQueue
);

router.put(
  '/admin/kyc/:id/approve',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.approveKyc
);

router.put(
  '/admin/kyc/:id/reject',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  validate(rejectKycSchema),
  controller.rejectKyc
);

export default router;
