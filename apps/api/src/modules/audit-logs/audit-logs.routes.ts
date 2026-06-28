import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import { z } from 'zod';
import { auditLogsController } from './audit-logs.controller';
import {
  listAuditLogsQuery,
  auditLogParams,
  entityAuditLogsParams,
} from './audit-logs.validator';

const router = Router();

// All audit log routes require admin access
const adminOnly = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN)];

// Export must be BEFORE /:id to avoid route conflict
router.get(
  '/audit-logs/export',
  ...adminOnly,
  validate(z.object({ query: listAuditLogsQuery })),
  auditLogsController.exportLogs
);

router.get(
  '/audit-logs',
  ...adminOnly,
  validate(z.object({ query: listAuditLogsQuery })),
  auditLogsController.list
);

router.get(
  '/audit-logs/entity/:resource_type/:resource_id',
  ...adminOnly,
  validate(z.object({ params: entityAuditLogsParams })),
  auditLogsController.getByEntity
);

router.get(
  '/audit-logs/:id',
  ...adminOnly,
  validate(z.object({ params: auditLogParams })),
  auditLogsController.getById
);

export default router;
