import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { Role } from '@indo-lelang/shared-types';
import { CampaignsController } from './campaigns.controller';
import { createCampaignSchema, listCampaignsQuery } from './campaigns.schema';

const router = Router();
const campaignsController = new CampaignsController();

router.get(
  '/admin/campaigns',
  authenticate,
  authorize(Role.SUPERADMIN, Role.ADMIN),
  validate(listCampaignsQuery),
  campaignsController.list
);

router.post(
  '/admin/campaigns',
  authenticate,
  authorize(Role.SUPERADMIN, Role.ADMIN),
  validate(createCampaignSchema),
  campaignsController.create
);

export default router;
