import { Request, Response, NextFunction } from 'express';
import { NiplService } from './nipl.service';
import { sendSuccess } from '../../lib/apiResponse';

const niplService = new NiplService();

export class NiplController {
  /**
   * Get current NIPL allocations status
   */
  async getNiplStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const status = await niplService.getNiplStatus(userId);
      sendSuccess(res, status, 'Status alokasi NIPL berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Allocate free NIPL to session
   */
  async allocate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { session_id, unit_type, quantity } = req.body;
      const result = await niplService.allocateNipl(userId, session_id, unit_type, quantity);
      sendSuccess(res, result, 'Alokasi NIPL berhasil disimpan');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reallocate unused NIPL to another session
   */
  async reallocate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { from_session_id, to_session_id, unit_type, quantity } = req.body;
      const result = await niplService.reallocateNipl(
        userId,
        from_session_id,
        to_session_id,
        unit_type,
        quantity
      );
      sendSuccess(res, result, 'Pemindahan alokasi NIPL berhasil disimpan');
    } catch (error) {
      next(error);
    }
  }
}
export default NiplController;
