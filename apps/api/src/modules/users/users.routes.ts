import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import {
  updateUserSchema,
  adminUpdateUserStatusSchema,
  getUsersQuerySchema,
  adminUpdateProviderStatusSchema,
  adminCreateUserSchema,
  adminUpdateUserInfoSchema,
} from './users.schema';

const router = Router();
const controller = new UsersController();

// Profile endpoints (Authenticated Users)
router.get('/users/profile', authenticate, controller.getProfile);
router.put('/users/profile', authenticate, validate(updateUserSchema), controller.updateProfile);
router.post('/bank/validate', authenticate, controller.validateBankAccount);

// Admin User Management routes
router.get(
  '/admin/users',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(getUsersQuerySchema),
  controller.getUsers
);

router.get(
  '/admin/users/:id',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  controller.getUserById
);

router.put(
  '/admin/users/:id/status',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(adminUpdateUserStatusSchema),
  controller.updateUserStatus
);

router.put(
  '/admin/users/:id/provider-status',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(adminUpdateProviderStatusSchema),
  controller.updateProviderStatus
);

router.post(
  '/admin/users',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(adminCreateUserSchema),
  controller.createUser
);

router.put(
  '/admin/users/:id',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(adminUpdateUserInfoSchema),
  controller.updateUser
);

router.delete(
  '/admin/users/:id',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  controller.deleteUser
);

export default router;
