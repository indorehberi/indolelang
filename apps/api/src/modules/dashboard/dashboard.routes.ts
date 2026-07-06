import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { Role } from '@indo-lelang/shared-types';

const router = Router();
const controller = new DashboardController();

router.get(
  '/admin/dashboard/stats',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  controller.getAdminStats
);

router.get(
  '/admin/dashboard/chart',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  controller.getChartData
);

export default router;
