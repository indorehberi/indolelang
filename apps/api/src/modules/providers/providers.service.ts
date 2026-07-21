import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { ProviderDTO, PaginationMeta, ApplicationStatus, KycStatus } from '@indo-lelang/shared-types';
import { Prisma } from '@prisma/client';
import { notificationsService } from '../notifications/notifications.service';
import { KycService } from '../kyc/kyc.service';
import { notifyAdmins } from '../../lib/notifyAdmins';

const kycService = new KycService();

export class ProvidersService {
  /**
   * Submit or update a provider application. Autofill of shared fields
   * (address/bank) from an existing bidder profile is handled client-side —
   * this only persists whatever the form submits.
   */
  async apply(
    userId: string,
    data: {
      company_name?: string;
      npwp?: string;
      npwp_url?: string;
      pks_number?: string;
      provider_type: string;
      address: string;
      bank_name?: string;
      bank_account_no?: string;
      bank_account_name?: string;
      nik?: string;
      ktp_url?: string;
      selfie_url?: string;
    }
  ): Promise<ProviderDTO> {
    const existing = await prisma.providers.findUnique({ where: { user_id: userId } });

    if (existing?.status === ApplicationStatus.AKTIF) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Anda sudah menjadi provider aktif');
    }

    const provider = await prisma.providers.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        status: ApplicationStatus.ANTRI,
        company_name: data.company_name ?? null,
        npwp: data.npwp ?? null,
        npwp_url: data.npwp_url ?? null,
        pks_number: data.pks_number,
        provider_type: data.provider_type,
        address: data.address,
        bank_name: data.bank_name,
        bank_account_no: data.bank_account_no,
        bank_account_name: data.bank_account_name,
      },
      update: {
        status: ApplicationStatus.ANTRI,
        company_name: data.company_name ?? null,
        npwp: data.npwp ?? null,
        npwp_url: data.npwp_url ?? null,
        pks_number: data.pks_number,
        provider_type: data.provider_type,
        address: data.address,
        bank_name: data.bank_name,
        bank_account_no: data.bank_account_no,
        bank_account_name: data.bank_account_name,
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        submitted_at: new Date(),
      },
    });

    if (data.nik || data.ktp_url || data.selfie_url) {
      await kycService.uploadDocuments(userId, {
        nik: data.nik,
        ktp_url: data.ktp_url,
        selfie_url: data.selfie_url,
      });
    }

    // Mirror the profile fields onto `users` too, same as the bidder flow —
    // any profile-completeness check reading GET /users/profile must see
    // this data without requiring a separate save.
    await prisma.users.update({
      where: { id: userId },
      data: {
        address: data.address,
        bank_name: data.bank_name,
        bank_account_no: data.bank_account_no,
        bank_account_name: data.bank_account_name,
        company_name: data.company_name ?? null,
        npwp: data.npwp ?? null,
      },
    });

    await notifyAdmins(
      'provider_application_submitted',
      'Pengajuan Provider Baru',
      `${data.company_name} mengajukan diri sebagai provider. Mohon ditinjau.`,
      '/users/provider'
    );

    return this.mapToDTO(provider);
  }

  async getMyProvider(userId: string): Promise<ProviderDTO | null> {
    const provider = await prisma.providers.findUnique({ where: { user_id: userId } });
    return provider ? this.mapToDTO(provider) : null;
  }

  async getProviders(
    page: number,
    perPage: number,
    status?: string,
    search?: string
  ): Promise<{ providers: ProviderDTO[]; meta: PaginationMeta }> {
    const where: any = {
      user: {
        deleted_at: null,
      },
    };
    if (status) where.status = status;
    if (search) {
      where.AND = [
        {
          user: {
            deleted_at: null,
          },
        },
        {
          OR: [
            { company_name: { contains: search, mode: 'insensitive' } },
            { npwp: { contains: search } },
            { user: { full_name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const skip = (page - 1) * perPage;
    const [total, records] = await Promise.all([
      prisma.providers.count({ where }),
      prisma.providers.findMany({
        where,
        skip,
        take: perPage,
        orderBy: [{ submitted_at: 'desc' }],
        include: { user: { include: { kyc_document: true } } },
      }),
    ]);

    const statusOrder: Record<string, number> = { antri: 0, aktif: 1, ditolak: 2, nonaktif: 3 };
    records.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

    return {
      providers: records.map((p) => this.mapToDTO(p)),
      meta: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) },
    };
  }

  async getProviderById(id: string): Promise<ProviderDTO> {
    const provider = await prisma.providers.findUnique({
      where: { id },
      include: { user: { include: { kyc_document: true } } },
    });
    if (!provider) throw new AppError(404, ErrorCode.NOT_FOUND, 'Data provider tidak ditemukan');
    return this.mapToDTO(provider);
  }

  async approve(
    id: string,
    reviewerId: string,
    feeConfig?: {
      provider_fee_type?: string;
      provider_fee_amount?: number;
      pmk41_paid_by_provider?: boolean;
    }
  ): Promise<ProviderDTO> {
    const provider = await prisma.providers.findUnique({ where: { id } });
    if (!provider) throw new AppError(404, ErrorCode.NOT_FOUND, 'Data provider tidak ditemukan');

    const [updated] = await prisma.$transaction([
      prisma.providers.update({
        where: { id },
        data: {
          status: ApplicationStatus.AKTIF,
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          rejection_reason: null,
          provider_fee_type: feeConfig?.provider_fee_type,
          provider_fee_amount:
            feeConfig?.provider_fee_amount !== undefined
              ? new Prisma.Decimal(feeConfig.provider_fee_amount)
              : undefined,
          pmk41_paid_by_provider: feeConfig?.pmk41_paid_by_provider,
        },
      }),
      // A provider becoming active can no longer bid — deactivate any bidder profile.
      prisma.bidders.updateMany({
        where: { user_id: provider.user_id, status: ApplicationStatus.AKTIF },
        data: { status: ApplicationStatus.NONAKTIF },
      }),
      prisma.users.update({
        where: { id: provider.user_id },
        data: { role: 'provider', status: 'active' },
      }),
      // Keep the KYC document's own status in sync — pages that read
      // /kyc/status directly must not stay "pending" after approval.
      prisma.kyc_documents.updateMany({
        where: { user_id: provider.user_id },
        data: { status: KycStatus.APPROVED, reviewer_id: reviewerId, reviewed_at: new Date() },
      }),
    ]);

    await notificationsService.createNotification({
      userId: provider.user_id,
      type: 'provider_approved',
      title: 'Pengajuan Provider Disetujui',
      body: 'Selamat, pengajuan Anda sebagai Mitra Provider Aset telah disetujui. Silakan login kembali untuk mengakses panel provider.',
    });

    return this.mapToDTO(updated);
  }

  async reject(id: string, reviewerId: string, reason: string): Promise<ProviderDTO> {
    const provider = await prisma.providers.findUnique({ where: { id } });
    if (!provider) throw new AppError(404, ErrorCode.NOT_FOUND, 'Data provider tidak ditemukan');

    const [updated] = await prisma.$transaction([
      prisma.providers.update({
        where: { id },
        data: {
          status: ApplicationStatus.NONAKTIF,
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          rejection_reason: reason,
        },
      }),
      prisma.kyc_documents.updateMany({
        where: { user_id: provider.user_id },
        data: { status: KycStatus.REJECTED, reviewer_id: reviewerId, reviewed_at: new Date(), rejection_reason: reason },
      }),
    ]);

    await notificationsService.createNotification({
      userId: provider.user_id,
      type: 'provider_rejected',
      title: 'Pengajuan Provider Ditolak',
      body: `Mohon maaf, pengajuan Anda sebagai Provider ditolak. Alasan: ${reason}. Silakan ajukan kembali.`,
    });

    return this.mapToDTO(updated);
  }

  private mapToDTO(provider: any): ProviderDTO {
    return {
      id: provider.id,
      user_id: provider.user_id,
      status: provider.status,
      company_name: provider.company_name || undefined,
      npwp: provider.npwp || undefined,
      npwp_url: provider.npwp_url || undefined,
      pks_number: provider.pks_number || undefined,
      provider_type: provider.provider_type || undefined,
      provider_fee_type: provider.provider_fee_type || undefined,
      provider_fee_amount: provider.provider_fee_amount ? Number(provider.provider_fee_amount) : undefined,
      pmk41_paid_by_provider: provider.pmk41_paid_by_provider,
      address: provider.address || undefined,
      bank_name: provider.bank_name || undefined,
      bank_account_no: provider.bank_account_no || undefined,
      bank_account_name: provider.bank_account_name || undefined,
      rejection_reason: provider.rejection_reason || undefined,
      reviewed_by: provider.reviewed_by || undefined,
      reviewed_at: provider.reviewed_at ? provider.reviewed_at.toISOString() : undefined,
      submitted_at: provider.submitted_at.toISOString(),
      created_at: provider.created_at.toISOString(),
      updated_at: provider.updated_at.toISOString(),
      kyc: provider.user?.kyc_document
        ? {
            id: provider.user.kyc_document.id,
            status: provider.user.kyc_document.status,
            ktp_url: provider.user.kyc_document.ktp_url || undefined,
            selfie_url: provider.user.kyc_document.selfie_url || undefined,
          }
        : undefined,
      user: provider.user
        ? {
            id: provider.user.id,
            email: provider.user.email,
            phone: provider.user.phone,
            full_name: provider.user.full_name,
            role: provider.user.role,
            status: provider.user.status,
            created_at: provider.user.created_at.toISOString(),
            updated_at: provider.user.updated_at.toISOString(),
          }
        : undefined,
    };
  }
}

export const providersService = new ProvidersService();
