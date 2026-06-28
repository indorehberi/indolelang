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
  authorize(Role.PROVIDER),
  validate(createAssetSchema),
  controller.createAsset
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

export default router;
