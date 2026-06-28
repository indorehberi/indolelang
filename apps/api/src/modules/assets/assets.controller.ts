import { Request, Response, NextFunction } from 'express';
import { AssetsService } from './assets.service';
import { sendSuccess } from '../../lib/apiResponse';
import { logAdminAction } from '../../lib/auditLog';
import { Role } from '@indo-lelang/shared-types';

const assetsService = new AssetsService();

export class AssetsController {
  /**
   * Get list of assets (Provider only sees theirs, Admin sees all)
   */
  async getAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const perPage = parseInt(req.query.per_page as string || '20', 10);
      const { status, category, search } = req.query as any;

      const providerId = req.user!.role === Role.PROVIDER ? req.user!.id : undefined;

      const { assets, meta } = await assetsService.getAssets(
        page,
        perPage,
        status,
        category,
        search,
        providerId
      );
      sendSuccess(res, assets, 'Daftar barang berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get asset details by ID
   */
  async getAssetById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await assetsService.getAssetById(id);
      sendSuccess(res, asset, 'Detail barang berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new asset (Provider submits a item)
   */
  async createAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = req.user!.id;
      const asset = await assetsService.createAsset(req.body, providerId);
      sendSuccess(res, asset, 'Barang baru berhasil diajukan untuk review', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve asset (Admin/Operator only)
   * Log action
   */
  async approveAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await assetsService.approveAsset(id);

      // Log admin audit trail
      logAdminAction(req, 'APPROVE_ASSET', 'assets', id, null, asset);

      sendSuccess(res, asset, 'Barang berhasil disetujui untuk lelang');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject / Return asset to provider (Admin/Operator only)
   * Log action
   */
  async rejectAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await assetsService.rejectAsset(id);

      // Log admin audit trail
      logAdminAction(req, 'REJECT_ASSET', 'assets', id, null, asset);

      sendSuccess(res, asset, 'Barang ditolak dan dikembalikan ke provider');
    } catch (error) {
      next(error);
    }
  }
}

export default AssetsController;
