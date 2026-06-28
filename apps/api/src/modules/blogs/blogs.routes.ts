import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import { z } from 'zod';
import { blogsController } from './blogs.controller';
import {
  createBlogBody,
  updateBlogBody,
  listBlogsQuery,
} from './blogs.validator';

const router = Router();

// Public routes
router.get(
  '/blogs',
  validate(z.object({ query: listBlogsQuery })),
  blogsController.listPublished
);

router.get(
  '/blogs/:slug',
  validate(z.object({ params: z.object({ slug: z.string() }) })),
  blogsController.getBySlug
);

// Admin/Operator routes
const adminOrOperator = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN, Role.OPERATOR)];

router.get(
  '/admin/blogs',
  ...adminOrOperator,
  validate(z.object({ query: listBlogsQuery })),
  blogsController.listAdmin
);

router.post(
  '/admin/blogs',
  ...adminOrOperator,
  validate(z.object({ body: createBlogBody })),
  blogsController.create
);

router.get(
  '/admin/blogs/:id',
  ...adminOrOperator,
  validate(z.object({ params: z.object({ id: z.string().uuid('ID harus berupa UUID') }) })),
  blogsController.getByIdAdmin
);

router.put(
  '/admin/blogs/:id',
  ...adminOrOperator,
  validate(z.object({
    params: z.object({ id: z.string().uuid('ID harus berupa UUID') }),
    body: updateBlogBody
  })),
  blogsController.update
);

router.delete(
  '/admin/blogs/:id',
  ...adminOrOperator,
  validate(z.object({ params: z.object({ id: z.string().uuid('ID harus berupa UUID') }) })),
  blogsController.delete
);

export default router;
