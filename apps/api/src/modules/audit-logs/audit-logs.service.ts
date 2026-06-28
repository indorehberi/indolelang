import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { logger } from '../../lib/logger';

interface ListAuditLogsQuery {
  page?: number;
  per_page?: number;
  user_id?: string;
  action?: string;
  resource_type?: string;
  from_date?: string;
  to_date?: string;
}

export class AuditLogsService {
  /**
   * List audit logs with filtering and pagination
   */
  async listAuditLogs(query: ListAuditLogsQuery) {
    const page = query.page || 1;
    const perPage = query.per_page || 20;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = {};

    if (query.user_id) {
      where.user_id = query.user_id;
    }
    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }
    if (query.resource_type) {
      where.resource_type = query.resource_type;
    }
    if (query.from_date || query.to_date) {
      where.created_at = {};
      if (query.from_date) {
        (where.created_at as Record<string, unknown>).gte = new Date(query.from_date);
      }
      if (query.to_date) {
        (where.created_at as Record<string, unknown>).lte = new Date(query.to_date);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.audit_logs.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get a single audit log by ID
   */
  async getAuditLogById(id: string) {
    const log = await prisma.audit_logs.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      throw new AppError(404, 'AUDIT_LOG_NOT_FOUND', 'Audit log tidak ditemukan');
    }

    return log;
  }

  /**
   * Get all audit logs for a specific entity (resource_type + resource_id)
   */
  async getEntityAuditLogs(resourceType: string, resourceId: string) {
    const logs = await prisma.audit_logs.findMany({
      where: {
        resource_type: resourceType,
        resource_id: resourceId,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return logs;
  }

  /**
   * Export audit logs (no pagination limit) for CSV/JSON export
   */
  async exportAuditLogs(query: ListAuditLogsQuery) {
    const where: Record<string, unknown> = {};

    if (query.user_id) {
      where.user_id = query.user_id;
    }
    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }
    if (query.resource_type) {
      where.resource_type = query.resource_type;
    }
    if (query.from_date || query.to_date) {
      where.created_at = {};
      if (query.from_date) {
        (where.created_at as Record<string, unknown>).gte = new Date(query.from_date);
      }
      if (query.to_date) {
        (where.created_at as Record<string, unknown>).lte = new Date(query.to_date);
      }
    }

    const logs = await prisma.audit_logs.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 10000, // Safety limit for exports
    });

    return logs;
  }
}

export const auditLogsService = new AuditLogsService();
