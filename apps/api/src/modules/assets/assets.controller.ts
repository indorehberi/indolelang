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

      const providerId = req.user!.role === Role.PROVIDER 
        ? req.user!.id 
        : (req.query.provider_id as string || undefined);

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
      let providerId = req.user!.id;
      if (req.user!.role !== Role.PROVIDER && req.body.provider_id) {
        providerId = req.body.provider_id;
      }
      const asset = await assetsService.createAsset(req.body, providerId);
      
      if (req.user!.role !== Role.PROVIDER) {
        logAdminAction(req, 'CREATE_ASSET', 'assets', asset.id, null, asset);
      }
      
      sendSuccess(res, asset, 'Barang baru berhasil ditambahkan', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an asset
   */
  async updateAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await assetsService.getAssetById(id);
      
      // Access control for editing
      const userRole = req.user!.role;
      if (userRole === Role.INSPECTOR && asset.status !== 'pending') {
        res.status(403).json({ success: false, error: { message: 'Inspector hanya dapat mengedit unit dengan status pending' } });
        return;
      }
      
      const updatedAsset = await assetsService.updateAsset(id, req.body);
      
      if (userRole !== Role.PROVIDER) {
        logAdminAction(req, 'UPDATE_ASSET', 'assets', id, asset, updatedAsset);
      }

      sendSuccess(res, updatedAsset, 'Barang berhasil diperbarui');
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
   * Inspect asset (Inspector action)
   * Log action
   */
  async inspectAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const inspectorId = req.user!.id; // from auth middleware
      const asset = await assetsService.inspectAsset(id, req.body, inspectorId);

      // Log admin audit trail
      logAdminAction(req, 'INSPECT_ASSET', 'assets', id, req.body, asset);

      sendSuccess(res, asset, 'Barang berhasil diinspeksi');
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

  /**
   * Delete asset (Inspector)
   */
  async deleteAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await assetsService.getAssetById(id);
      await assetsService.deleteAsset(id);
      
      logAdminAction(req, 'DELETE_ASSET', 'assets', id, asset, null);

      res.status(200).json({ success: true, message: 'Barang berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Re-review asset (Inspector)
   */
  async reviewAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await assetsService.reviewAsset(id);

      logAdminAction(req, 'REVIEW_ASSET', 'assets', id, null, asset);

      sendSuccess(res, asset, 'Barang diajukan ulang untuk direview');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel approval (Admin/Operator)
   */
  async cancelApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await assetsService.cancelApproval(id);

      logAdminAction(req, 'CANCEL_APPROVAL', 'assets', id, null, asset);

      sendSuccess(res, asset, 'Persetujuan barang berhasil dibatalkan');
    } catch (error) {
      next(error);
    }
  }
}
export default AssetsController;

