import { Router } from 'express';
import { NiplController } from './nipl.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { allocateSchema, reallocateSchema } from './nipl.schema';

const router = Router();
const controller = new NiplController();

router.get('/nipl/status', authenticate, controller.getNiplStatus);
router.post('/nipl/allocate', authenticate, validate(allocateSchema), controller.allocate);
router.post('/nipl/reallocate', authenticate, validate(reallocateSchema), controller.reallocate);

export default router;
