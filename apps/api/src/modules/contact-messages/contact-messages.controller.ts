import { Request, Response } from 'express';
import { contactMessagesService } from './contact-messages.service';
import { sendSuccess, sendError } from '../../lib/apiResponse';

export class ContactMessagesController {
  async create(req: Request, res: Response) {
    try {
      const data = await contactMessagesService.create(req.body);
      sendSuccess(res, data, 'Pesan berhasil dikirim', undefined, 201);
    } catch (error: any) {
      sendError(res, 'CREATE_MESSAGE_FAILED', error.message, undefined, 400);
    }
  }

  async listAdmin(req: Request, res: Response) {
    try {
      const { page, limit, is_read, search } = req.query as any;
      const result = await contactMessagesService.findAll({ page, limit, is_read, search });
      sendSuccess(res, result.data, 'Berhasil mengambil daftar pesan', {
        page: result.page,
        per_page: result.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / result.limit),
      });
    } catch (error: any) {
      sendError(res, 'FETCH_MESSAGES_FAILED', error.message, undefined, 500);
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const data = await contactMessagesService.markAsRead(req.params.id);
      sendSuccess(res, data, 'Pesan ditandai sudah dibaca');
    } catch (error: any) {
      sendError(res, 'MARK_READ_FAILED', error.message, undefined, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await contactMessagesService.delete(req.params.id);
      sendSuccess(res, null, 'Pesan berhasil dihapus');
    } catch (error: any) {
      sendError(res, 'DELETE_MESSAGE_FAILED', error.message, undefined, 400);
    }
  }
}

export const contactMessagesController = new ContactMessagesController();
