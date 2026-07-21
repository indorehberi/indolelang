import { Router } from 'express';
import { LotsController } from './lots.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import {
  createLotSchema,
  updateLotSchema,
  getLotsQuerySchema,
} from './lots.schema';

const router = Router();
const controller = new LotsController();

// Public endpoints
router.get('/lots', validate(getLotsQuerySchema), controller.getLots);
// NOTE: /lots/history/* MUST come before /lots/:id to avoid Express treating "history" as an :id param
router.get('/lots/history/me', authenticate, controller.getMyHistory);
router.get('/lots/history/stats', authenticate, controller.getMyActivityStats);
router.get('/lots/:id', controller.getLotById);
router.get('/lots/:id/bids', controller.getLotBids);
router.post('/lots/:id/view', controller.incrementView);
router.post('/lots/:id/like', controller.toggleLike);

// Admin & Operator endpoints
router.post(
  '/admin/lots',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  validate(createLotSchema),
  controller.createLot
);

router.put(
  '/admin/lots/:id',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  validate(updateLotSchema),
  controller.updateLot
);

router.delete(
  '/admin/lots/:id',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.deleteLot
);

router.post(
  '/admin/lots/:id/cancel',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.cancelLot
);

router.post(
  '/admin/lots/:id/uncancel',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.uncancelLot
);

router.post(
  '/admin/lots/:id/paid',
  authenticate,
  authorize(Role.ADMIN, Role.OPERATOR, Role.SUPERADMIN),
  controller.markAsPaid
);

export default router;
