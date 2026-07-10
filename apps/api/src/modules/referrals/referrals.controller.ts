import { Request, Response, NextFunction } from 'express';
import { referralsService } from './referrals.service';
import { sendSuccess } from '../../lib/apiResponse';

class ReferralsController {
  async getAdminReferrals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 20;
      const search = (req.query.search as string) || '';
      
      const result = await referralsService.getAdminReferrals(page, perPage, search);
      sendSuccess(res, result.data, 'Berhasil mengambil data referral', result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getMyReferral(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await referralsService.getMyReferral(userId);
      sendSuccess(res, result, 'Berhasil mengambil info referral');
    } catch (error) {
      next(error);
    }
  }

  async generateReferral(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await referralsService.generateReferral(userId);
      sendSuccess(res, result, 'Berhasil meng-generate kode referral');
    } catch (error) {
      next(error);
    }
  }
}

export default ReferralsController;
