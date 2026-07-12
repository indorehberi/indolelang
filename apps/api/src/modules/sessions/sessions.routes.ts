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
router.get(
  '/admin/reports/sessions',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.getSessionReports
);

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

router.delete(
  '/admin/sessions/:id',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.deleteSession
);

export default router;
