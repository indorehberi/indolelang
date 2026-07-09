import { Router } from 'express';
import * as galleriesController from './galleries.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { createGallerySchema } from './galleries.validator';
import { Role } from '@indo-lelang/shared-types';

const router = Router();

/**
 * @route   GET /api/public/galleries
 * @desc    Get all galleries (public)
 * @access  Public
 */
router.get('/public', galleriesController.getPublicGalleries);

/**
 * @route   GET /api/admin/galleries
 * @desc    Get all galleries (admin)
 * @access  Private (Admin/Superadmin)
 */
router.get(
  '/admin',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  galleriesController.getAdminGalleries
);

/**
 * @route   POST /api/admin/galleries
 * @desc    Add a new gallery image
 * @access  Private (Admin/Superadmin)
 */
router.post(
  '/admin',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  validate(createGallerySchema),
  galleriesController.createGallery
);

/**
 * @route   DELETE /api/admin/galleries/:id
 * @desc    Delete a gallery image
 * @access  Private (Admin/Superadmin)
 */
router.delete(
  '/admin/:id',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  galleriesController.deleteGallery
);

export default router;
