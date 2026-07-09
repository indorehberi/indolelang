import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { BidderDTO, PaginationMeta, ApplicationStatus } from '@indo-lelang/shared-types';
import { notificationsService } from '../notifications/notifications.service';
import { KycService } from '../kyc/kyc.service';

const kycService = new KycService();

export class BiddersService {
  /**
   * Submit or update a bidder application (profile data + optional KTP/selfie).
   * Creates the bidders row if it doesn't exist yet, otherwise resets it to
   * "antri" so admin can re-review after a resubmission.
   */
  async apply(
    userId: string,
    data: {
      address?: string;
      occupation?: string;
      bank_name?: string;
      bank_account_no?: string;
      bank_account_name?: string;
      nik?: string;
      ktp_url?: string;
      selfie_url?: string;
    }
  ): Promise<BidderDTO> {
    const existing = await prisma.bidders.findUnique({ where: { user_id: userId } });

    if (existing?.status === ApplicationStatus.AKTIF) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Anda sudah menjadi bidder aktif');
    }

    const bidder = await prisma.bidders.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        status: ApplicationStatus.ANTRI,
        address: data.address,
        occupation: data.occupation,
        bank_name: data.bank_name,
        bank_account_no: data.bank_account_no,
        bank_account_name: data.bank_account_name,
      },
      update: {
        status: ApplicationStatus.ANTRI,
        address: data.address,
        occupation: data.occupation,
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

    return this.mapToDTO(bidder);
  }

  async getMyBidder(userId: string): Promise<BidderDTO | null> {
    const bidder = await prisma.bidders.findUnique({ where: { user_id: userId } });
    return bidder ? this.mapToDTO(bidder) : null;
  }

  /**
   * Admin list of bidder applications — only users who actually applied.
   * Sorted "antri" (queue) first, then "aktif", newest first within each group.
   */
  async getBidders(
    page: number,
    perPage: number,
    status?: string,
    search?: string
  ): Promise<{ bidders: BidderDTO[]; meta: PaginationMeta }> {
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.user = {
        OR: [
          { full_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      };
    }

    const skip = (page - 1) * perPage;
    const [total, records] = await Promise.all([
      prisma.bidders.count({ where }),
      prisma.bidders.findMany({
        where,
        skip,
        take: perPage,
        orderBy: [{ submitted_at: 'desc' }],
        include: { user: { include: { kyc_document: true } } },
      }),
    ]);

    const statusOrder: Record<string, number> = { antri: 0, aktif: 1, ditolak: 2, nonaktif: 3 };
    records.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

    const niplCounts = await prisma.deposits.groupBy({
      by: ['user_id'],
      where: { user_id: { in: records.map((r) => r.user_id) }, status: 'paid' },
      _count: { id: true },
    });
    const niplByUser = new Map(niplCounts.map((n) => [n.user_id, n._count.id]));

    return {
      bidders: records.map((b) => this.mapToDTO(b, niplByUser.get(b.user_id) || 0)),
      meta: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) },
    };
  }

  async getBidderById(id: string): Promise<BidderDTO> {
    const bidder = await prisma.bidders.findUnique({
      where: { id },
      include: { user: { include: { kyc_document: true } } },
    });
    if (!bidder) throw new AppError(404, ErrorCode.NOT_FOUND, 'Data bidder tidak ditemukan');
    return this.mapToDTO(bidder);
  }

  async approve(id: string, reviewerId: string): Promise<BidderDTO> {
    const bidder = await prisma.bidders.findUnique({ where: { id } });
    if (!bidder) throw new AppError(404, ErrorCode.NOT_FOUND, 'Data bidder tidak ditemukan');

    const [updated] = await prisma.$transaction([
      prisma.bidders.update({
        where: { id },
        data: {
          status: ApplicationStatus.AKTIF,
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          rejection_reason: null,
        },
      }),
      prisma.users.update({
        where: { id: bidder.user_id },
        data: { role: 'bidder', status: 'active' },
      }),
    ]);

    await notificationsService.createNotification({
      userId: bidder.user_id,
      type: 'bidder_approved',
      title: 'Pengajuan Bidder Disetujui',
      body: 'Selamat, pengajuan Anda sebagai Bidder telah disetujui. Anda sekarang dapat membeli NIPL dan mengikuti lelang.',
    });

    return this.mapToDTO(updated);
  }

  async reject(id: string, reviewerId: string, reason: string): Promise<BidderDTO> {
    const bidder = await prisma.bidders.findUnique({ where: { id } });
    if (!bidder) throw new AppError(404, ErrorCode.NOT_FOUND, 'Data bidder tidak ditemukan');

    const updated = await prisma.bidders.update({
      where: { id },
      data: {
        status: ApplicationStatus.DITOLAK,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        rejection_reason: reason,
      },
    });

    await notificationsService.createNotification({
      userId: bidder.user_id,
      type: 'bidder_rejected',
      title: 'Pengajuan Bidder Ditolak',
      body: `Mohon maaf, pengajuan Anda sebagai Bidder ditolak. Alasan: ${reason}. Silakan ajukan kembali.`,
    });

    return this.mapToDTO(updated);
  }

  private mapToDTO(bidder: any, niplCount?: number): BidderDTO {
    return {
      id: bidder.id,
      user_id: bidder.user_id,
      status: bidder.status,
      address: bidder.address || undefined,
      occupation: bidder.occupation || undefined,
      bank_name: bidder.bank_name || undefined,
      bank_account_no: bidder.bank_account_no || undefined,
      bank_account_name: bidder.bank_account_name || undefined,
      rejection_reason: bidder.rejection_reason || undefined,
      reviewed_by: bidder.reviewed_by || undefined,
      reviewed_at: bidder.reviewed_at ? bidder.reviewed_at.toISOString() : undefined,
      submitted_at: bidder.submitted_at.toISOString(),
      created_at: bidder.created_at.toISOString(),
      updated_at: bidder.updated_at.toISOString(),
      active_nipl_count: niplCount,
      kyc: bidder.user?.kyc_document
        ? {
            id: bidder.user.kyc_document.id,
            status: bidder.user.kyc_document.status,
            ktp_url: bidder.user.kyc_document.ktp_url || undefined,
            selfie_url: bidder.user.kyc_document.selfie_url || undefined,
          }
        : undefined,
      user: bidder.user
        ? {
            id: bidder.user.id,
            email: bidder.user.email,
            phone: bidder.user.phone,
            full_name: bidder.user.full_name,
            role: bidder.user.role,
            status: bidder.user.status,
            created_at: bidder.user.created_at.toISOString(),
            updated_at: bidder.user.updated_at.toISOString(),
          }
        : undefined,
    };
  }
}

export const biddersService = new BiddersService();
