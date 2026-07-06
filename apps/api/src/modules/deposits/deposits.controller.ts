import { Request, Response, NextFunction } from 'express';
import { DepositsService } from './deposits.service';
import { sendSuccess } from '../../lib/apiResponse';
import { Role } from '@indo-lelang/shared-types';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';

const depositsService = new DepositsService();

export class DepositsController {
  /**
   * Get list of deposits (Admin monitoring or bidder history)
   */
  async getDeposits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const perPage = parseInt(req.query.per_page as string || '20', 10);
      const { session_id, status } = req.query as any;

      let userId: string | undefined;

      // Bidder can only see their own deposits
      if (req.user!.role === Role.BIDDER) {
        userId = req.user!.id;
      } else {
        // Admin/Operator/Superadmin can optionally filter by user_id
        userId = req.query.user_id as string || undefined;
      }

      const { deposits, meta } = await depositsService.getDeposits(
        page,
        perPage,
        userId,
        session_id,
        status
      );

      sendSuccess(res, deposits, 'Daftar transaksi deposit berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register NIPL (Purchase session deposit and generate Virtual Account)
   */
  async createDeposit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { session_id, unit_type, package_type, bank } = req.body;

      const deposit = await depositsService.createDeposit(userId, session_id, unit_type, package_type, bank);

      sendSuccess(res, deposit, 'Pendaftaran NIPL berhasil, Virtual Account telah dibuat', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request refund for a paid deposit (Bidder only)
   */
  async requestRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = await depositsService.requestRefund(userId, id);
      
      sendSuccess(res, result, 'Pengajuan refund berhasil. Uang jaminan sedang diproses untuk dikembalikan.');
    } catch (error) {
      next(error);
    }
  }
}

export default DepositsController;
