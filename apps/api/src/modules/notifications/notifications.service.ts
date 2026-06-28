import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { logger } from '../../lib/logger';

interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  body: string;
  deepLink?: string;
}

interface ListNotificationsQuery {
  page?: number;
  per_page?: number;
  is_read?: boolean;
}

export class NotificationsService {
  /**
   * List notifications for a specific user with pagination
   */
  async listNotifications(userId: string, query: ListNotificationsQuery) {
    const page = query.page || 1;
    const perPage = query.per_page || 20;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = { user_id: userId };
    if (query.is_read !== undefined) {
      where.is_read = query.is_read;
    }

    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.notifications.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get count of unread notifications for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notifications.count({
      where: { user_id: userId, is_read: false },
    });
  }

  /**
   * Mark a single notification as read, verifying ownership
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notifikasi tidak ditemukan');
    }

    if (notification.user_id !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki akses ke notifikasi ini');
    }

    const updated = await prisma.notifications.update({
      where: { id: notificationId },
      data: { is_read: true },
    });

    return updated;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notifications.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });

    return { updated_count: result.count };
  }

  /**
   * Create a new notification for a user
   */
  async createNotification(data: CreateNotificationData) {
    try {
      const notification = await prisma.notifications.create({
        data: {
          user_id: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          deep_link: data.deepLink || null,
          is_read: false,
        },
      });

      return notification;
    } catch (error) {
      logger.error({ error, data }, 'Failed to create notification');
      throw new AppError(500, 'NOTIFICATION_CREATE_FAILED', 'Gagal membuat notifikasi');
    }
  }
}

export const notificationsService = new NotificationsService();
