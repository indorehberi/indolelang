import { Request, Response, NextFunction } from 'express';
import { LotsService } from './lots.service';
import { sendSuccess } from '../../lib/apiResponse';
import { logAdminAction } from '../../lib/auditLog';

const lotsService = new LotsService();

export class LotsController {
  /**
   * Get all lots (public list, filtered by session_id/status)
   */
  async getLots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const perPage = parseInt(req.query.per_page as string || '20', 10);
      const { session_id, status } = req.query as any;

      const { lots, meta } = await lotsService.getLots(
        page,
        perPage,
        session_id,
        status
      );
      sendSuccess(res, lots, 'Daftar lot lelang berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get lot by ID (public details)
   */
  async getLotById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const lot = await lotsService.getLotById(id);
      sendSuccess(res, lot, 'Detail lot lelang berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new lot (Admin/Operator only)
   */
  async createLot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lot = await lotsService.createLot(req.body);

      // Log admin action
      logAdminAction(req, 'CREATE_LOT', 'lots', lot.id, null, lot);

      sendSuccess(res, lot, 'Lot lelang baru berhasil dibuat', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update lot details (Admin/Operator only)
   */
  async updateLot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const oldLot = await lotsService.getLotById(id);
      const lot = await lotsService.updateLot(id, req.body);

      // Log admin action
      logAdminAction(req, 'UPDATE_LOT', 'lots', id, oldLot, lot);

      sendSuccess(res, lot, 'Lot lelang berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }
}

export default LotsController;
