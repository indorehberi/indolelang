import { Request, Response, NextFunction } from 'express';
import { biddersService } from './bidders.service';
import { sendSuccess } from '../../lib/apiResponse';
import { logAdminAction } from '../../lib/auditLog';

export class BiddersController {
  async apply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const bidder = await biddersService.apply(userId, req.body);
      sendSuccess(res, bidder, 'Pengajuan bidder berhasil dikirim');
    } catch (error) {
      next(error);
    }
  }

  async getMyBidder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const bidder = await biddersService.getMyBidder(userId);
      sendSuccess(res, bidder, 'Status bidder berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  async getBidders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, per_page, status, search } = req.query as any;
      const { bidders, meta } = await biddersService.getBidders(page, per_page, status, search);
      sendSuccess(res, bidders, 'Daftar bidder berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  }

  async getBidderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bidder = await biddersService.getBidderById(req.params.id);
      sendSuccess(res, bidder, 'Detail bidder berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewerId = (req as any).user!.id;
      const bidder = await biddersService.approve(req.params.id, reviewerId);
      logAdminAction(req, 'APPROVE_BIDDER', 'bidders', req.params.id, null, bidder);
      sendSuccess(res, bidder, 'Pengajuan bidder disetujui');
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewerId = (req as any).user!.id;
      const { reason } = req.body;
      const bidder = await biddersService.reject(req.params.id, reviewerId, reason);
      logAdminAction(req, 'REJECT_BIDDER', 'bidders', req.params.id, null, bidder);
      sendSuccess(res, bidder, 'Pengajuan bidder ditolak');
    } catch (error) {
      next(error);
    }
  }

  async adjustNipl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user!.id;
      const { mobil_count, motor_count } = req.body;
      const result = await biddersService.adjustNiplCount(
        req.params.id,
        adminId,
        mobil_count ?? 0,
        motor_count ?? 0
      );
      logAdminAction(req, 'ADJUST_NIPL', 'bidders', req.params.id, null, result);
      sendSuccess(res, result, 'Jumlah NIPL berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }
}

export default BiddersController;
