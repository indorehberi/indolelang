import { Router } from 'express';
import { HealthController } from './health.controller';

const router = Router();
const controller = new HealthController();

router.get('/', controller.checkHealth);

export default router;
