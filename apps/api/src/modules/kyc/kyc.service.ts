import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { KycDocumentDTO, PaginationMeta, KycStatus, UserStatus } from '@indo-lelang/shared-types';
import { isFeatureEnabled } from '../../lib/featureToggle';
import { logger } from '../../lib/logger';
import { FeatureToggle } from '@indo-lelang/shared-types';

export class KycService {
  /**
   * Upload / update KYC documents
   */
  async uploadDocuments(
    userId: string,
    data: { ktp_url?: string; selfie_url?: string; ktp_selfie_url?: string }
  ): Promise<KycDocumentDTO> {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, ErrorCode.USER_NOT_FOUND, 'Pengguna tidak ditemukan');
    }

    const doc = await prisma.kyc_documents.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ktp_url: data.ktp_url,
        selfie_url: data.selfie_url,
        ktp_selfie_url: data.ktp_selfie_url,
        status: KycStatus.PENDING,
      },
      update: {
        ktp_url: data.ktp_url ?? undefined,
        selfie_url: data.selfie_url ?? undefined,
        ktp_selfie_url: data.ktp_selfie_url ?? undefined,
        status: KycStatus.PENDING,
        reviewer_id: null,
        reviewed_at: null,
        rejection_reason: null,
      },
    });

    return this.mapToDTO(doc);
  }

  /**
   * Get user's KYC status
   */
  async getKycStatus(userId: string): Promise<KycDocumentDTO> {
    const doc = await prisma.kyc_documents.findUnique({
      where: { user_id: userId },
    });

    if (!doc) {
      throw new AppError(404, ErrorCode.KYC_NOT_FOUND, 'Dokumen KYC belum diunggah');
    }

    return this.mapToDTO(doc);
  }

  /**
   * Run automated eKYC auto verification (Verihubs mock/integration)
   */
  async autoVerify(userId: string): Promise<{ success: boolean; status: KycStatus; message: string }> {
    const isAutoKycEnabled = await isFeatureEnabled(FeatureToggle.EKYC_AUTO);
    if (!isAutoKycEnabled) {
      throw new AppError(
        400,
        ErrorCode.FEATURE_DISABLED,
        'Verifikasi KYC otomatis dinonaktifkan. Silakan gunakan antrean manual.'
      );
    }

    const doc = await prisma.kyc_documents.findUnique({
      where: { user_id: userId },
    });

    if (!doc) {
      throw new AppError(404, ErrorCode.KYC_NOT_FOUND, 'Dokumen KYC tidak ditemukan untuk verifikasi');
    }

    if (doc.status === KycStatus.APPROVED) {
      return { success: true, status: KycStatus.APPROVED, message: 'KYC Anda sudah terverifikasi' };
    }

    logger.info({ userId }, 'Running auto eKYC verification via Verihubs integration');

    // Simulated auto eKYC checks:
    // If photos are uploaded, we simulate success. If URLs contain "fail", we reject.
    const shouldFail =
      doc.ktp_url?.includes('fail') ||
      doc.selfie_url?.includes('fail') ||
      doc.ktp_selfie_url?.includes('fail');

    if (shouldFail) {
      const updated = await prisma.kyc_documents.update({
        where: { user_id: userId },
        data: {
          status: KycStatus.REJECTED,
          rejection_reason: 'Foto KTP atau Selfie buram / tidak terdeteksi oleh sistem eKYC otomatis',
          reviewed_at: new Date(),
          provider_ref_id: 'vh-err-' + Math.random().toString(36).substring(7),
        },
      });

      return {
        success: false,
        status: KycStatus.REJECTED,
        message: updated.rejection_reason!,
      };
    }

    // Success auto verification
    await prisma.$transaction([
      prisma.kyc_documents.update({
        where: { user_id: userId },
        data: {
          status: KycStatus.APPROVED,
          reviewed_at: new Date(),
          provider_ref_id: 'vh-ok-' + Math.random().toString(36).substring(7),
        },
      }),
      prisma.users.update({
        where: { id: userId },
        data: { status: UserStatus.ACTIVE },
      }),
    ]);

    return {
      success: true,
      status: KycStatus.APPROVED,
      message: 'Verifikasi eKYC otomatis berhasil. Akun Anda telah aktif.',
    };
  }

  /**
   * Get pending KYC queue (Admin/Operator only)
   */
  async getQueue(
    page: number,
    perPage: number,
    status: KycStatus
  ): Promise<{ queue: KycDocumentDTO[]; meta: PaginationMeta }> {
    const where = { status };
    const skip = (page - 1) * perPage;

    const [total, records] = await Promise.all([
      prisma.kyc_documents.count({ where }),
      prisma.kyc_documents.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'asc' },
        include: { user: true },
      }),
    ]);

    const queue = records.map((doc) => this.mapToDTO(doc));
    const totalPages = Math.ceil(total / perPage);

    return {
      queue,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Manually approve KYC document (Admin/Operator only)
   */
  async approveKyc(id: string, reviewerId: string): Promise<KycDocumentDTO> {
    const doc = await prisma.kyc_documents.findUnique({
      where: { id },
    });

    if (!doc) {
      throw new AppError(404, ErrorCode.KYC_NOT_FOUND, 'Dokumen KYC tidak ditemukan');
    }

    const [updatedDoc] = await prisma.$transaction([
      prisma.kyc_documents.update({
        where: { id },
        data: {
          status: KycStatus.APPROVED,
          reviewer_id: reviewerId,
          reviewed_at: new Date(),
        },
      }),
      prisma.users.update({
        where: { id: doc.user_id },
        data: { status: UserStatus.ACTIVE },
      }),
    ]);

    return this.mapToDTO(updatedDoc);
  }

  /**
   * Manually reject KYC document (Admin/Operator only)
   */
  async rejectKyc(id: string, reviewerId: string, reason: string): Promise<KycDocumentDTO> {
    const doc = await prisma.kyc_documents.findUnique({
      where: { id },
    });

    if (!doc) {
      throw new AppError(404, ErrorCode.KYC_NOT_FOUND, 'Dokumen KYC tidak ditemukan');
    }

    const updatedDoc = await prisma.kyc_documents.update({
      where: { id },
      data: {
        status: KycStatus.REJECTED,
        reviewer_id: reviewerId,
        reviewed_at: new Date(),
        rejection_reason: reason,
      },
    });

    return this.mapToDTO(updatedDoc);
  }

  private mapToDTO(doc: any): KycDocumentDTO {
    return {
      id: doc.id,
      user_id: doc.user_id,
      ktp_url: doc.ktp_url || undefined,
      selfie_url: doc.selfie_url || undefined,
      ktp_selfie_url: doc.ktp_selfie_url || undefined,
      status: doc.status,
      reviewer_id: doc.reviewer_id || undefined,
      reviewed_at: doc.reviewed_at ? doc.reviewed_at.toISOString() : undefined,
      rejection_reason: doc.rejection_reason || undefined,
      provider_ref_id: doc.provider_ref_id || undefined,
      created_at: doc.created_at.toISOString(),
    };
  }
}
