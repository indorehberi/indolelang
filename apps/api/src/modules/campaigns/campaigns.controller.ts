import { Request, Response, NextFunction } from 'express';
import { CampaignsService } from './campaigns.service';
import { sendSuccess } from '../../lib/apiResponse';

const campaignsService = new CampaignsService();

export class CampaignsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const perPage = parseInt(req.query.per_page as string || '20', 10);
      const result = await campaignsService.listCampaigns(page, perPage);
      sendSuccess(res, result.campaigns, 'Daftar campaign berhasil dimuat', result.meta);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await campaignsService.createCampaign(req.body);
      sendSuccess(res, campaign, 'Campaign berhasil dibuat dan sedang dikirim', undefined, 201);
    } catch (error) {
      next(error);
    }
  }
}
