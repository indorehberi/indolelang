import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import crypto from 'crypto';
import { BidderDTO, PaginationMeta, ApplicationStatus, KycStatus } from '@indo-lelang/shared-types';
import { notificationsService } from '../notifications/notifications.service';
import { KycService } from '../kyc/kyc.service';
import { notifyAdmins } from '../../lib/notifyAdmins';
import { grantsUnlimitedNow, niplSlotsFor } from '../../lib/niplPackage';

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
      // An admin can activate an account before any KYC documents exist
      // (adminCreateUser without KTP/selfie) — those users must still be able
      // to submit eKYC here, otherwise they can never pass the deposit gate.
      // Only block resubmission when approved documents actually exist.
      const kycDoc = await prisma.kyc_documents.findUnique({ where: { user_id: userId } });
      if (kycDoc?.status === KycStatus.APPROVED) {
        throw new AppError(400, ErrorCode.BAD_REQUEST, 'Anda sudah menjadi bidder aktif');
      }
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

    // Mirror the profile fields onto `users` too — the dashboard's
    // "lengkapi profil" banner reads GET /users/profile, not this bidder
    // application row, and would otherwise stay stuck forever.
    await prisma.users.update({
      where: { id: userId },
      data: {
        address: data.address,
        occupation: data.occupation,
        bank_name: data.bank_name,
        bank_account_no: data.bank_account_no,
        bank_account_name: data.bank_account_name,
      },
    });

    const user = await prisma.users.findUnique({ where: { id: userId }, select: { full_name: true } });
    await notifyAdmins(
      'bidder_application_submitted',
      'Pengajuan Bidder Baru',
      `${user?.full_name || 'Seorang pengguna'} mengajukan diri sebagai bidder. Mohon ditinjau.`,
      '/users/bidder'
    );

    return this.mapToDTO(bidder);
  }

  private async getBidderNiplStats(userId: string) {
    const deposits = await prisma.deposits.findMany({
      where: { user_id: userId, status: 'paid' },
      select: { package_type: true, unit_type: true, unlimited_downgraded_at: true },
    });

    // An unlimited deposit only grants unlimited wins on the WIB day it was
    // activated; after the daily cron stamps unlimited_downgraded_at it is
    // treated as an ordinary deposit worth its remaining NIPL codes.
    const unlimitedMobil = deposits.some(d => grantsUnlimitedNow(d) && d.unit_type === 'mobil');
    const unlimitedMotor = deposits.some(d => grantsUnlimitedNow(d) && d.unit_type === 'motor');

    const activeCodes = await prisma.nipl_codes.findMany({
      where: {
        status: 'active',
        deposit: { user_id: userId, status: 'paid' }
      },
      select: { unit_type: true }
    });

    const niplMobil = activeCodes.filter(c => c.unit_type === 'mobil').length;
    const niplMotor = activeCodes.filter(c => c.unit_type === 'motor').length;
    const niplCount = activeCodes.length;

    return { niplCount, niplMobil, niplMotor, unlimitedMobil, unlimitedMotor };
  }

  async getMyBidder(userId: string): Promise<BidderDTO | null> {
    const bidder = await prisma.bidders.findUnique({
      where: { user_id: userId },
      include: { user: { include: { kyc_document: true } } }
    });
    if (!bidder) return null;
    const stats = await this.getBidderNiplStats(userId);
    return this.mapToDTO(bidder, stats.niplCount, stats.niplMobil, stats.niplMotor, stats.unlimitedMobil, stats.unlimitedMotor);
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
    const userFilter: any = {
      deleted_at: null,
      role: { not: 'provider' },
      OR: [
        { provider_app: null },
        {
          provider_app: {
            status: { notIn: ['antri', 'aktif'] }
          }
        }
      ]
    };

    const where: any = {
      user: userFilter,
    };
    if (status) where.status = status;
    if (search) {
      userFilter.AND = [
        {
          OR: [
            { full_name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ]
        }
      ];
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

    const userIds = records.map((r) => r.user_id);

    const [deposits, activeCodes] = await Promise.all([
      prisma.deposits.findMany({
        where: { user_id: { in: userIds }, status: 'paid' },
        select: { user_id: true, package_type: true, unit_type: true, unlimited_downgraded_at: true },
      }),
      // Counting live NIPL slots rather than deriving from package_type keeps
      // this list agreeing with the single-bidder view, and is the only way to
      // get a downgraded unlimited deposit right: its package_type still reads
      // "unlimited", but what the bidder actually holds is whatever slots are
      // left unused.
      prisma.nipl_codes.findMany({
        where: {
          status: 'active',
          deposit: { user_id: { in: userIds }, status: 'paid' },
        },
        select: { unit_type: true, deposit: { select: { user_id: true } } },
      }),
    ]);

    const niplByUser = new Map<string, { total: number; mobil: number; motor: number; unlimitedMobil: boolean; unlimitedMotor: boolean }>();
    const blank = () => ({ total: 0, mobil: 0, motor: 0, unlimitedMobil: false, unlimitedMotor: false });

    for (const code of activeCodes) {
      const userId = code.deposit?.user_id;
      if (!userId) continue;
      const current = niplByUser.get(userId) || blank();
      current.total += 1;
      if (code.unit_type === 'mobil') current.mobil += 1;
      else if (code.unit_type === 'motor') current.motor += 1;
      niplByUser.set(userId, current);
    }

    for (const dep of deposits) {
      if (!grantsUnlimitedNow(dep)) continue;
      const current = niplByUser.get(dep.user_id) || blank();
      if (dep.unit_type === 'mobil') current.unlimitedMobil = true;
      else if (dep.unit_type === 'motor') current.unlimitedMotor = true;
      niplByUser.set(dep.user_id, current);
    }

    return {
      bidders: records.map((b) => {
        const nipl = niplByUser.get(b.user_id) || { total: 0, mobil: 0, motor: 0, unlimitedMobil: false, unlimitedMotor: false };
        return this.mapToDTO(b, nipl.total, nipl.mobil, nipl.motor, nipl.unlimitedMobil, nipl.unlimitedMotor);
      }),
      meta: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) },
    };
  }

  async getBidderById(id: string): Promise<BidderDTO> {
    const bidder = await prisma.bidders.findUnique({
      where: { id },
      include: { user: { include: { kyc_document: true } } },
    });
    if (!bidder) throw new AppError(404, ErrorCode.NOT_FOUND, 'Data bidder tidak ditemukan');

    const stats = await this.getBidderNiplStats(bidder.user_id);

    return this.mapToDTO(bidder, stats.niplCount, stats.niplMobil, stats.niplMotor, stats.unlimitedMobil, stats.unlimitedMotor);
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
      // Keep the KYC document's own status in sync — the bidder's profile
      // page reads /kyc/status directly, and it must not stay "pending"
      // forever once the application itself has been approved.
      prisma.kyc_documents.updateMany({
        where: { user_id: bidder.user_id },
        data: { status: KycStatus.APPROVED, reviewer_id: reviewerId, reviewed_at: new Date() },
      }),
    ]);

    await notificationsService.createNotification({
      userId: bidder.user_id,
      type: 'bidder_approved',
      title: 'Pengajuan Bidder Disetujui',
      body: 'Selamat, pengajuan Anda sebagai Bidder telah disetujui. Anda sekarang dapat membeli NIPL dan mengikuti lelang.',
    });

    const stats = await this.getBidderNiplStats(bidder.user_id);

    return this.mapToDTO(updated, stats.niplCount, stats.niplMobil, stats.niplMotor, stats.unlimitedMobil, stats.unlimitedMotor);
  }

  async reject(id: string, reviewerId: string, reason: string): Promise<BidderDTO> {
    const bidder = await prisma.bidders.findUnique({ where: { id } });
    if (!bidder) throw new AppError(404, ErrorCode.NOT_FOUND, 'Data bidder tidak ditemukan');

    const [updated] = await prisma.$transaction([
      prisma.bidders.update({
        where: { id },
        data: {
          status: ApplicationStatus.NONAKTIF,
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          rejection_reason: reason,
        },
      }),
      prisma.kyc_documents.updateMany({
        where: { user_id: bidder.user_id },
        data: { status: KycStatus.REJECTED, reviewer_id: reviewerId, reviewed_at: new Date(), rejection_reason: reason },
      }),
    ]);

    await notificationsService.createNotification({
      userId: bidder.user_id,
      type: 'bidder_rejected',
      title: 'Pengajuan Bidder Ditolak',
      body: `Mohon maaf, pengajuan Anda sebagai Bidder ditolak. Alasan: ${reason}. Silakan ajukan kembali.`,
    });

    const stats = await this.getBidderNiplStats(bidder.user_id);

    return this.mapToDTO(updated, stats.niplCount, stats.niplMobil, stats.niplMotor, stats.unlimitedMobil, stats.unlimitedMotor);
  }

  async reVerify(id: string, reviewerId: string): Promise<any> {
    const bidder = await prisma.bidders.findUnique({ where: { id } });
    if (!bidder) throw new AppError(404, ErrorCode.NOT_FOUND, 'Data bidder tidak ditemukan');

    const userId = bidder.user_id;

    await prisma.$transaction([
      prisma.bidders.delete({
        where: { id },
      }),
      prisma.users.update({
        where: { id: userId },
        data: { status: 'pending' },
      }),
      prisma.kyc_documents.deleteMany({
        where: { user_id: userId },
      }),
    ]);

    return { id, user_id: userId, status: 'deleted_for_reverify' };
  }

  /**
   * Admin adjusts NIPL count for a bidder.
   * Expires all existing paid deposits and optionally creates a single
   * adjustment deposit with the target count. Also supports per-unit-type
   * adjustment (mobil/motor).
   */
  async adjustNiplCount(
    bidderId: string,
    adminId: string,
    mobilCount: number,
    motorCount: number
  ): Promise<{ mobil: number; motor: number }> {
    const bidder = await prisma.bidders.findUnique({ where: { id: bidderId } });
    if (!bidder) throw new AppError(404, ErrorCode.NOT_FOUND, 'Data bidder tidak ditemukan');

    const userId = bidder.user_id;

    // Get current counts for audit log
    const oldMobil = await prisma.nipl_codes.count({
      where: {
        status: 'active',
        unit_type: 'mobil',
        deposit: { user_id: userId, status: 'paid' }
      }
    });

    const oldMotor = await prisma.nipl_codes.count({
      where: {
        status: 'active',
        unit_type: 'motor',
        deposit: { user_id: userId, status: 'paid' }
      }
    });

    // Expire all existing paid deposits for this user
    await prisma.deposits.updateMany({
      where: { user_id: userId, status: 'paid' },
      data: { status: 'expired' },
    });

    // Also expire their active NIPL codes
    await prisma.nipl_codes.updateMany({
      where: {
        status: 'active',
        deposit: { user_id: userId }
      },
      data: { status: 'expired' }
    });

    const createdDeposits: any[] = [];

    // Create new adjustment deposit for mobil if count > 0
    if (mobilCount > 0) {
      const dep = await prisma.deposits.create({
        data: {
          user_id: userId,
          session_id: null,
          amount: 0,
          unit_type: 'mobil',
          package_type: String(mobilCount),
          va_number: null,
          va_bank: null,
          payment_method: 'admin_adjustment',
          status: 'paid',
          is_manual: true,
          paid_at: new Date(),
        },
      });
      createdDeposits.push(dep);
    }

    // Create new adjustment deposit for motor if count > 0
    if (motorCount > 0) {
      const dep = await prisma.deposits.create({
        data: {
          user_id: userId,
          session_id: null,
          amount: 0,
          unit_type: 'motor',
          package_type: String(motorCount),
          va_number: null,
          va_bank: null,
          payment_method: 'admin_adjustment',
          status: 'paid',
          is_manual: true,
          paid_at: new Date(),
        },
      });
      createdDeposits.push(dep);
    }

    // Create nipl_codes for each newly created deposit
    for (const dep of createdDeposits) {
      const count = niplSlotsFor(dep.package_type, 1);
      for (let i = 0; i < count; i++) {
        const code = `NIPL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        await prisma.nipl_codes.create({
          data: { deposit_id: dep.id, code, unit_type: dep.unit_type! },
        });
      }
    }

    return { mobil: mobilCount, motor: motorCount };
  }

  private mapToDTO(bidder: any, niplCount?: number, niplMobil?: number, niplMotor?: number, unlimitedMobil?: boolean, unlimitedMotor?: boolean): BidderDTO {
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
      nipl_mobil: niplMobil,
      nipl_motor: niplMotor,
      is_unlimited_mobil: unlimitedMobil,
      is_unlimited_motor: unlimitedMotor,
      kyc: bidder.user?.kyc_document
        ? {
            id: bidder.user.kyc_document.id,
            status: bidder.user.kyc_document.status,
            nik: bidder.user.kyc_document.nik || undefined,
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
            npwp: bidder.user.npwp || undefined,
            npwp_url: bidder.user.npwp_url || undefined,
            created_at: bidder.user.created_at.toISOString(),
            updated_at: bidder.user.updated_at.toISOString(),
          }
        : undefined,
    };
  }
}

export const biddersService = new BiddersService();
