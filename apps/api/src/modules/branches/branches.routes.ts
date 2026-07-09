import { Router } from 'express';
import { BranchesController } from './branches.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import { createBranchSchema, updateBranchSchema } from './branches.schema';

const router = Router();
const controller = new BranchesController();

// Public endpoints
router.get('/branches', controller.getBranches);
router.get('/branches/:id', controller.getBranchById);

// Admin-only endpoints
router.post(
  '/admin/branches',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(createBranchSchema),
  controller.createBranch
);

router.put(
  '/admin/branches/:id',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(updateBranchSchema),
  controller.updateBranch
);

router.patch(
  '/admin/branches/:id/status',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  controller.toggleBranchStatus
);

export default router;
