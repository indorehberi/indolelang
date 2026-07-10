import { prisma } from '../config/database';
import { Role } from '@indo-lelang/shared-types';
import { logger } from './logger';

const DEFAULT_STAFF_ROLES = [Role.SUPERADMIN, Role.ADMIN, Role.OPERATOR, Role.FINANCE];

/**
 * Create one notification per staff user (admin/superadmin/operator/finance by
 * default). Used for payment-queue events an admin needs to act on manually —
 * deposit proof uploaded, checkout proof uploaded, refund requested, lot sold.
 */
export async function notifyAdmins(
  type: string,
  title: string,
  body: string,
  deepLink?: string,
  roles: Role[] = DEFAULT_STAFF_ROLES
): Promise<void> {
  try {
    const staff = await prisma.users.findMany({
      where: { role: { in: roles } },
      select: { id: true },
    });

    if (staff.length === 0) return;

    await prisma.notifications.createMany({
      data: staff.map((s) => ({
        user_id: s.id,
        type,
        title,
        body,
        deep_link: deepLink || null,
      })),
    });
  } catch (err) {
    // Non-fatal: the triggering action (proof upload, refund request, etc.)
    // should still succeed even if the notification fan-out fails.
    logger.error({ err, type }, 'Failed to notify admins');
  }
}
