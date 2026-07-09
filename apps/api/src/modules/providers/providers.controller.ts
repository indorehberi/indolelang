import { Request, Response, NextFunction } from 'express';
import { providersService } from './providers.service';
import { sendSuccess } from '../../lib/apiResponse';
import { logAdminAction } from '../../lib/auditLog';

export class ProvidersController {
  async apply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const provider = await providersService.apply(userId, req.body);
      sendSuccess(res, provider, 'Pengajuan provider berhasil dikirim');
    } catch (error) {
      next(error);
    }
  }

  async getMyProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const provider = await providersService.getMyProvider(userId);
      sendSuccess(res, provider, 'Status provider berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  async getProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, per_page, status, search } = req.query as any;
      const { providers, meta } = await providersService.getProviders(page, per_page, status, search);
      sendSuccess(res, providers, 'Daftar provider berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  }

  async getProviderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providersService.getProviderById(req.params.id);
      sendSuccess(res, provider, 'Detail provider berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewerId = (req as any).user!.id;
      const { provider_fee_type, provider_fee_amount, pmk41_paid_by_provider } = req.body;
      const provider = await providersService.approve(req.params.id, reviewerId, {
        provider_fee_type,
        provider_fee_amount,
        pmk41_paid_by_provider,
      });
      logAdminAction(req, 'APPROVE_PROVIDER', 'providers', req.params.id, null, provider);
      sendSuccess(res, provider, 'Pengajuan provider disetujui');
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewerId = (req as any).user!.id;
      const { reason } = req.body;
      const provider = await providersService.reject(req.params.id, reviewerId, reason);
      logAdminAction(req, 'REJECT_PROVIDER', 'providers', req.params.id, null, provider);
      sendSuccess(res, provider, 'Pengajuan provider ditolak');
    } catch (error) {
      next(error);
    }
  }
}

export default ProvidersController;
