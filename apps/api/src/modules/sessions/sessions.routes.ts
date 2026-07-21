import { Router } from 'express';
import { SessionsController } from './sessions.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import { upload } from '../../middleware/upload';
import {
  createSessionSchema,
  updateSessionSchema,
  getSessionsQuerySchema,
} from './sessions.schema';
import {
  downloadExclusiveStatement,
  registerExclusive,
  getRegistrationStatus,
  getRegistrants,
  approveRegistrant,
  rejectRegistrant,
} from './exclusive.controller';

const router = Router();
const controller = new SessionsController();

// Public endpoints
router.get('/sessions', validate(getSessionsQuerySchema), controller.getSessions);
router.get('/sessions/:id', controller.getSessionById);

// Bidder exclusive session endpoints
router.get(
  '/sessions/:id/exclusive/document',
  authenticate,
  downloadExclusiveStatement
);

router.get(
  '/sessions/:id/exclusive/status',
  authenticate,
  getRegistrationStatus
);

router.post(
  '/sessions/:id/exclusive/register',
  authenticate,
  upload.single('file'),
  registerExclusive
);

// Admin exclusive session management endpoints
router.get(
  '/admin/sessions/:id/exclusive/registrants',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  getRegistrants
);

router.post(
  '/admin/sessions/:id/exclusive/registrants/:regId/approve',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  approveRegistrant
);

router.post(
  '/admin/sessions/:id/exclusive/registrants/:regId/reject',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  rejectRegistrant
);

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
