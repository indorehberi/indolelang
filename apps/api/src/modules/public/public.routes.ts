import { Router } from 'express';
import { PublicController } from './public.controller';

const router = Router();
const controller = new PublicController();

router.get('/sessions', controller.getSessions);
router.get('/sessions/:id', controller.getSessionDetail);
router.get('/lots/featured', controller.getFeaturedLots);
router.get('/categories/stats', controller.getCategoryStats);
router.get('/stats', controller.getPlatformStats);

export default router;
