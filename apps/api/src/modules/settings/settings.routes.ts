import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import { updateSettingSchema, getSettingsQuerySchema } from './settings.schema';

const router = Router();
const controller = new SettingsController();

// Admin / Superadmin platform settings routes
router.get(
  '/admin/settings',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(getSettingsQuerySchema),
  controller.getSettings
);

router.get(
  '/admin/settings/:key',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  controller.getSettingByKey
);

router.put(
  '/admin/settings/:key',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(updateSettingSchema),
  controller.updateSetting
);

export default router;
