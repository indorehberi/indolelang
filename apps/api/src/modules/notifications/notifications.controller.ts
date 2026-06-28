import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess } from '../../lib/apiResponse';

export class NotificationsController {
  /**
   * GET /notifications — List notifications for authenticated user
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const query = req.query as { page?: number; per_page?: number; is_read?: boolean };

      const result = await notificationsService.listNotifications(userId, query);

      sendSuccess(res, result.data, 'Daftar notifikasi berhasil dimuat', result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /notifications/unread-count — Get unread notification count
   */
  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const count = await notificationsService.getUnreadCount(userId);

      sendSuccess(res, { unread_count: count }, 'Jumlah notifikasi belum dibaca');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /notifications/:id/read — Mark single notification as read
   */
  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await notificationsService.markAsRead(userId, id);

      sendSuccess(res, notification, 'Notifikasi ditandai sudah dibaca');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /notifications/read-all — Mark all notifications as read
   */
  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await notificationsService.markAllAsRead(userId);

      sendSuccess(res, result, 'Semua notifikasi ditandai sudah dibaca');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
