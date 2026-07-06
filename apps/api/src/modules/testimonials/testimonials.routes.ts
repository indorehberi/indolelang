import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import { z } from 'zod';
import { testimonialsController } from './testimonials.controller';
import {
  createTestimonialBody,
  moderateTestimonialBody,
  listTestimonialsQuery,
  adminCreateTestimonialBody,
  adminUpdateTestimonialBody
} from './testimonials.validator';

const router = Router();

// Public routes
router.get(
  '/testimonials',
  validate(z.object({ query: listTestimonialsQuery })),
  testimonialsController.listApproved
);

// Authenticated user routes (Bidder/Provider/Admin/Operator)
router.post(
  '/testimonials',
  authenticate,
  validate(z.object({ body: createTestimonialBody })),
  testimonialsController.create
);

// Admin/Operator routes
const adminOrOperator = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN, Role.OPERATOR)];

router.get(
  '/admin/testimonials',
  ...adminOrOperator,
  validate(z.object({ query: listTestimonialsQuery })),
  testimonialsController.listAdmin
);

router.get(
  '/admin/testimonials/:id',
  ...adminOrOperator,
  validate(z.object({ params: z.object({ id: z.string().uuid('ID harus berupa UUID') }) })),
  testimonialsController.getByIdAdmin
);

router.post(
  '/admin/testimonials',
  ...adminOrOperator,
  validate(z.object({ body: adminCreateTestimonialBody })),
  testimonialsController.createAdmin
);

router.put(
  '/admin/testimonials/:id',
  ...adminOrOperator,
  validate(z.object({
    params: z.object({ id: z.string().uuid('ID harus berupa UUID') }),
    body: adminUpdateTestimonialBody
  })),
  testimonialsController.updateAdmin
);

router.put(
  '/admin/testimonials/:id/status',
  ...adminOrOperator,
  validate(z.object({
    params: z.object({ id: z.string().uuid('ID harus berupa UUID') }),
    body: moderateTestimonialBody
  })),
  testimonialsController.moderate
);

router.delete(
  '/admin/testimonials/:id',
  ...adminOrOperator,
  validate(z.object({ params: z.object({ id: z.string().uuid('ID harus berupa UUID') }) })),
  testimonialsController.delete
);

export default router;
