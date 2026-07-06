import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import { z } from 'zod';
import { contactMessagesController } from './contact-messages.controller';
import { createMessageBody, listMessagesQuery } from './contact-messages.validator';

const router = Router();

// Public route (to submit message)
router.post(
  '/contact-messages',
  validate(z.object({ body: createMessageBody })),
  contactMessagesController.create
);

// Admin/Operator routes
const adminOrOperator = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN, Role.OPERATOR)];

router.get(
  '/admin/contact-messages',
  ...adminOrOperator,
  validate(z.object({ query: listMessagesQuery })),
  contactMessagesController.listAdmin
);

router.patch(
  '/admin/contact-messages/:id/read',
  ...adminOrOperator,
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  contactMessagesController.markAsRead
);

router.delete(
  '/admin/contact-messages/:id',
  ...adminOrOperator,
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  contactMessagesController.delete
);

export default router;
