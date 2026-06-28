import { Request } from 'express';
import { prisma } from '../config/database';
import { logger } from './logger';

interface AuditLogOptions {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: Record<string, unknown> | string;
  newValue?: Record<string, unknown> | string;
  ipAddress?: string;
}

/**
 * Write a new entry to the immutable audit_logs database table
 */
export async function logAuditAction(options: AuditLogOptions): Promise<void> {
  try {
    const serialize = (val: unknown): string | null => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'string') return val;
      return JSON.stringify(val);
    };

    await prisma.audit_logs.create({
      data: {
        user_id: options.userId || null,
        action: options.action,
        resource_type: options.resourceType,
        resource_id: options.resourceId || null,
        old_value: serialize(options.oldValue),
        new_value: serialize(options.newValue),
        ip_address: options.ipAddress || null,
      },
    });
  } catch (error) {
    // We log the error but don't throw it, so business logic isn't blocked by audit logging failures
    logger.error({ error, options }, 'Failed to write audit log to database');
  }
}

/**
 * Express helper to extract IP and user from request for logging
 */
export function logAdminAction(
  req: Request,
  action: string,
  resourceType: string,
  resourceId?: string,
  oldValue?: unknown,
  newValue?: unknown
): void {
  const userId = req.user?.id;
  const ipAddress = req.ip || req.socket.remoteAddress || undefined;

  // Run asynchronously
  logAuditAction({
    userId,
    action,
    resourceType,
    resourceId,
    oldValue: oldValue as any,
    newValue: newValue as any,
    ipAddress,
  });
}
