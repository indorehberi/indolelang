import { Request, Response, NextFunction } from 'express';
import { PublicService } from './public.service';
import { sendSuccess } from '../../lib/apiResponse';

const publicService = new PublicService();

export class PublicController {
  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getPublicSessions();
      sendSuccess(res, {
        data,
        message: 'Berhasil mengambil daftar sesi lelang publik',
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessionDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await publicService.getPublicSessionDetail(id);
      sendSuccess(res, {
        data,
        message: 'Berhasil mengambil detail sesi lelang publik',
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeaturedLots(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getFeaturedLots();
      sendSuccess(res, {
        data,
        message: 'Berhasil mengambil daftar lot unggulan publik',
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getCategoryStats();
      sendSuccess(res, {
        data,
        message: 'Berhasil mengambil statistik kategori publik',
      });
    } catch (error) {
      next(error);
    }
  }

  async getPlatformStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getPlatformStats();
      sendSuccess(res, {
        data,
        message: 'Berhasil mengambil statistik platform publik',
      });
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getPublicSettings();
      sendSuccess(res, {
        data,
        message: 'Berhasil mengambil pengaturan platform publik',
      });
    } catch (error) {
      next(error);
    }
  }
}
