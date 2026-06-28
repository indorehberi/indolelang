import { Request, Response, NextFunction } from 'express';
import { documentsService } from './documents.service';
import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { Role } from '@indo-lelang/shared-types';
import { sendSuccess } from '../../lib/apiResponse';
import path from 'path';
import fs from 'fs';

export class DocumentsController {
  private async checkAccess(invoiceId: string, req: Request): Promise<void> {
    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Invoice tidak ditemukan');
    }

    const { role, id: userId } = req.user!;
    const isAuthorized =
      role === Role.SUPERADMIN ||
      role === Role.ADMIN ||
      role === Role.OPERATOR ||
      (role === Role.BIDDER && invoice.bidder_id === userId);

    if (!isAuthorized) {
      throw new AppError(403, ErrorCode.FORBIDDEN, 'Anda tidak memiliki akses untuk dokumen ini');
    }
  }

  downloadInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { invoiceId } = req.params;
      await this.checkAccess(invoiceId, req);

      const doc = await documentsService.generateInvoicePdf(invoiceId);
      const filePath = path.join(process.cwd(), doc.file_url);

      if (!fs.existsSync(filePath)) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'File dokumen tidak ditemukan di server');
      }

      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  };

  downloadSuratJalan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { invoiceId } = req.params;
      await this.checkAccess(invoiceId, req);

      const doc = await documentsService.generateSuratJalanPdf(invoiceId);
      const filePath = path.join(process.cwd(), doc.file_url);

      if (!fs.existsSync(filePath)) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'File dokumen tidak ditemukan di server');
      }

      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  };

  downloadBast = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { invoiceId } = req.params;
      await this.checkAccess(invoiceId, req);

      const doc = await documentsService.generateBastPdf(invoiceId);
      const filePath = path.join(process.cwd(), doc.file_url);

      if (!fs.existsSync(filePath)) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'File dokumen tidak ditemukan di server');
      }

      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  };

  verifyDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { qr_hash } = req.params;
      const data = await documentsService.verifyDocument(qr_hash);
      sendSuccess(res, data, 'Verifikasi dokumen berhasil');
    } catch (error) {
      next(error);
    }
  };

  getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const perPage = parseInt(req.query.per_page as string || '20', 10);
      const { status } = req.query as any;

      let userId: string | undefined;

      if (req.user!.role === Role.BIDDER) {
        userId = req.user!.id;
      } else {
        userId = (req.query.user_id as string) || undefined;
      }

      const { invoices, meta } = await documentsService.getInvoices(page, perPage, userId, status);
      sendSuccess(res, invoices, 'Daftar invoice pelunasan berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  };
}

export default DocumentsController;
