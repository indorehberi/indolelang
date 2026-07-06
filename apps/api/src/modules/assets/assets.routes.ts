import { Router } from 'express';
import { AssetsController } from './assets.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import {
  createAssetSchema,
  updateAssetSchema,
  getAssetsQuerySchema,
} from './assets.schema';

const router = Router();
const controller = new AssetsController();

// Provider & Admin endpoints (authenticated)
router.get('/assets', authenticate, validate(getAssetsQuerySchema), controller.getAssets);
router.get('/assets/:id', authenticate, controller.getAssetById);

// Provider only submission endpoint
router.post(
  '/assets',
  authenticate,
  authorize(Role.PROVIDER, Role.INSPECTOR, Role.ADMIN, Role.SUPERADMIN),
  validate(createAssetSchema),
  controller.createAsset
);

// Edit asset
router.put(
  '/assets/:id',
  authenticate,
  authorize(Role.PROVIDER, Role.INSPECTOR, Role.ADMIN, Role.SUPERADMIN, Role.OPERATOR),
  validate(updateAssetSchema),
  controller.updateAsset
);

// Admin & Operator approval endpoints
router.put(
  '/admin/assets/:id/approve',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.approveAsset
);

router.put(
  '/admin/assets/:id/reject',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.rejectAsset
);


router.delete(
  '/assets/:id',
  authenticate,
  authorize(Role.INSPECTOR, Role.ADMIN, Role.SUPERADMIN),
  controller.deleteAsset
);

router.put(
  '/assets/:id/review',
  authenticate,
  authorize(Role.INSPECTOR, Role.ADMIN, Role.SUPERADMIN),
  controller.reviewAsset
);

router.put(
  '/admin/assets/:id/cancel',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.cancelApproval
);

export default router;

