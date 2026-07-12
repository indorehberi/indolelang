import { Request, Response, NextFunction } from 'express';
import { SessionsService } from './sessions.service';
import { sendSuccess } from '../../lib/apiResponse';
import { logAdminAction } from '../../lib/auditLog';

const sessionsService = new SessionsService();

export class SessionsController {
  /**
   * Get all sessions (Public list)
   */
  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const perPage = parseInt(req.query.per_page as string || '20', 10);
      const { status, branch_id, search } = req.query as any;

      const { sessions, meta } = await sessionsService.getSessions(
        page,
        perPage,
        status,
        branch_id,
        search
      );
      sendSuccess(res, sessions, 'Daftar sesi lelang berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get session details by ID
   */
  async getSessionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const session = await sessionsService.getSessionById(id);
      sendSuccess(res, session, 'Detail sesi lelang berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new auction session (Admin/Operator only)
   * Write audit log
   */
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = req.user!.id;
      const session = await sessionsService.createSession(req.body, operatorId);

      // Log admin audit trail
      logAdminAction(req, 'CREATE_AUCTION_SESSION', 'auction_sessions', session.id, null, session);

      sendSuccess(res, session, 'Sesi lelang baru berhasil dibuat', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update auction session (Admin/Operator only)
   * Write audit log
   */
  async updateSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const operatorId = req.user!.id;

      const oldSession = await sessionsService.getSessionById(id);
      const session = await sessionsService.updateSession(id, req.body, operatorId);

      // Log admin audit trail
      logAdminAction(req, 'UPDATE_AUCTION_SESSION', 'auction_sessions', id, oldSession, session);

      sendSuccess(res, session, 'Sesi lelang berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete auction session (Admin/Operator only)
   * Write audit log
   */
  async deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const oldSession = await sessionsService.getSessionById(id);

      await sessionsService.deleteSession(id);

      // Log admin audit trail
      logAdminAction(req, 'DELETE_AUCTION_SESSION', 'auction_sessions', id, oldSession, null);

      sendSuccess(res, null, 'Sesi lelang berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get session reports (Admin/Operator only)
   */
  async getSessionReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const perPage = parseInt(req.query.per_page as string || '20', 10);
      const search = req.query.search as string;

      const { reports, meta } = await sessionsService.getSessionReports(
        page,
        perPage,
        search
      );
      
      sendSuccess(res, reports, 'Laporan sesi lelang berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  }
}

export default SessionsController;
