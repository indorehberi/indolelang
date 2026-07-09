import { Router } from 'express';
import { ProvidersController } from './providers.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import {
  applyProviderSchema,
  getProvidersQuerySchema,
  rejectProviderSchema,
  approveProviderSchema,
} from './providers.schema';

const router = Router();
const controller = new ProvidersController();

// Self-service (authenticated user)
router.get('/providers/me', authenticate, controller.getMyProvider);
router.post('/providers/apply', authenticate, validate(applyProviderSchema), controller.apply);

// Admin
router.get(
  '/admin/providers',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(getProvidersQuerySchema),
  controller.getProviders
);

router.get(
  '/admin/providers/:id',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  controller.getProviderById
);

router.put(
  '/admin/providers/:id/approve',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(approveProviderSchema),
  controller.approve
);

router.put(
  '/admin/providers/:id/reject',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(rejectProviderSchema),
  controller.reject
);

export default router;
