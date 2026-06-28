import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { z } from 'zod';
import { notificationsController } from './notifications.controller';
import { listNotificationsQuery, markReadParams } from './notifications.validator';

const router = Router();

// All routes require authentication
router.get(
  '/notifications',
  authenticate,
  validate(z.object({ query: listNotificationsQuery })),
  notificationsController.list
);

router.get(
  '/notifications/unread-count',
  authenticate,
  notificationsController.unreadCount
);

// Mark all must be BEFORE /:id to avoid route conflict
router.put(
  '/notifications/read-all',
  authenticate,
  notificationsController.markAllRead
);

router.put(
  '/notifications/:id/read',
  authenticate,
  validate(z.object({ params: markReadParams })),
  notificationsController.markRead
);

export default router;
