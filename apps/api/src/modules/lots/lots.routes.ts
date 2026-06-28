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
router.get('/lots/:id', controller.getLotById);

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

export default router;
