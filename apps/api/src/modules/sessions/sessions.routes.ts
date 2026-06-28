import { Router } from 'express';
import { SessionsController } from './sessions.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import {
  createSessionSchema,
  updateSessionSchema,
  getSessionsQuerySchema,
} from './sessions.schema';

const router = Router();
const controller = new SessionsController();

// Public endpoints
router.get('/sessions', validate(getSessionsQuerySchema), controller.getSessions);
router.get('/sessions/:id', controller.getSessionById);

// Admin & Operator endpoints
router.post(
  '/admin/sessions',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  validate(createSessionSchema),
  controller.createSession
);

router.put(
  '/admin/sessions/:id',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  validate(updateSessionSchema),
  controller.updateSession
);

export default router;
