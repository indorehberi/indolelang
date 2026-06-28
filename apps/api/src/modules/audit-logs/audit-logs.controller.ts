import { Request, Response, NextFunction } from 'express';
import { auditLogsService } from './audit-logs.service';
import { sendSuccess } from '../../lib/apiResponse';

export class AuditLogsController {
  /**
   * GET /audit-logs — List audit logs with filters
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as {
        page?: number;
        per_page?: number;
        user_id?: string;
        action?: string;
        resource_type?: string;
        from_date?: string;
        to_date?: string;
      };

      const result = await auditLogsService.listAuditLogs(query);

      sendSuccess(res, result.data, 'Daftar audit log berhasil dimuat', result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /audit-logs/export — Export audit logs (no pagination)
   */
  async exportLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as {
        user_id?: string;
        action?: string;
        resource_type?: string;
        from_date?: string;
        to_date?: string;
      };

      const logs = await auditLogsService.exportAuditLogs(query);

      sendSuccess(res, logs, `Export ${logs.length} audit log berhasil`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /audit-logs/:id — Get single audit log by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const log = await auditLogsService.getAuditLogById(id);

      sendSuccess(res, log, 'Detail audit log berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /audit-logs/entity/:resource_type/:resource_id — Get logs for specific entity
   */
  async getByEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const { resource_type, resource_id } = req.params;
      const logs = await auditLogsService.getEntityAuditLogs(resource_type, resource_id);

      sendSuccess(res, logs, `Audit log untuk ${resource_type} berhasil dimuat`);
    } catch (error) {
      next(error);
    }
  }
}

export const auditLogsController = new AuditLogsController();
