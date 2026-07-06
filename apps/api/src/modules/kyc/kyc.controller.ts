import { Request, Response, NextFunction } from 'express';
import { KycService } from './kyc.service';
import { sendSuccess } from '../../lib/apiResponse';
import { logAdminAction } from '../../lib/auditLog';
import { KycStatus } from '@indo-lelang/shared-types';

const kycService = new KycService();

export class KycController {
  /**
   * Upload user KYC documents
   */
  async uploadDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const doc = await kycService.uploadDocuments(userId, req.body);
      sendSuccess(res, doc, 'Dokumen KYC berhasil diunggah. Menunggu verifikasi.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's KYC status
   */
  async getKycStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const doc = await kycService.getKycStatus(userId);
      sendSuccess(res, doc, 'Status KYC berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Run automated eKYC verification
   */
  async autoVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await kycService.autoVerify(userId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get KYC queue for manual review (Admin/Operator only)
   */
  async getQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, per_page, status } = req.query as any;
      const pageNum = Number(page) || 1;
      const perPageNum = Number(per_page) || 20;
      
      const { queue, meta } = await kycService.getQueue(
        pageNum,
        perPageNum,
        status as KycStatus
      );
      sendSuccess(res, queue, 'Antrean KYC berhasil dimuat', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manually approve a KYC document (Admin/Operator only)
   */
  async approveKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reviewerId = req.user!.id;

      const doc = await kycService.approveKyc(id, reviewerId);

      // Write admin action audit trail
      logAdminAction(
        req,
        'APPROVE_KYC',
        'kyc_documents',
        id,
        { status: KycStatus.PENDING },
        { status: KycStatus.APPROVED }
      );

      sendSuccess(res, doc, 'Verifikasi KYC disetujui');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manually reject a KYC document (Admin/Operator only)
   */
  async rejectKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const reviewerId = req.user!.id;

      const doc = await kycService.rejectKyc(id, reviewerId, rejection_reason);

      // Write admin action audit trail
      logAdminAction(
        req,
        'REJECT_KYC',
        'kyc_documents',
        id,
        { status: KycStatus.PENDING },
        { status: KycStatus.REJECTED, rejection_reason }
      );

      sendSuccess(res, doc, 'Verifikasi KYC ditolak');
    } catch (error) {
      next(error);
    }
  }
}

export default KycController;
