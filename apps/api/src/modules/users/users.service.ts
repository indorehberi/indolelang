import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { UserDTO, PaginationMeta, Role, UserStatus } from '@indo-lelang/shared-types';
import { Prisma } from '@prisma/client';
import { hashPassword } from '../../lib/hash';
import { grantsUnlimitedNow, niplSlotsFor } from '../../lib/niplPackage';
import { notificationsService } from '../notifications/notifications.service';
export class UsersService {
  /**
   * Get list of users with pagination and filtering (Admin only)
   */
  async getUsers(
    page: number,
    perPage: number,
    role?: Role | string,
    status?: UserStatus,
    search?: string,
    provider_status?: string
  ): Promise<{ users: UserDTO[]; meta: PaginationMeta }> {
    const where: Prisma.usersWhereInput = {
      deleted_at: null,
    };

    if (role) {
      if (role.includes(',')) {
        where.role = { in: role.split(',') as any[] };
      } else {
        where.role = role as any;
      }
    }
    if (status) {
      where.status = status as any;
    }
    if (provider_status) {
      where.provider_status = provider_status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { full_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * perPage;

    const [total, records] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
        include: {
          deposits: {
            where: {
              status: 'paid'
            }
          },
          kyc_document: true
        }
      }),
    ]);

    const users: UserDTO[] = records.map((user: any) => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      company_name: user.company_name || undefined,
      npwp: user.npwp || undefined,
      provider_status: user.provider_status || undefined,
      active_nipl_count: (() => {
        const deps = user.deposits || [];
        return deps.reduce(
          (sum: number, d: any) => (d ? sum + niplSlotsFor(d.package_type) : sum),
          0
        );
      })(),
      is_unlimited_nipl: (() => {
        const deps = user.deposits || [];
        // Unlimited only counts while the deposit is still inside its
        // activation day; the daily cron stamps unlimited_downgraded_at once
        // that day has passed.
        return deps.some((d: any) => d && grantsUnlimitedNow(d));
      })(),
      kyc: user.kyc_document ? {
        id: user.kyc_document.id,
        status: user.kyc_document.status,
        ktp_url: user.kyc_document.ktp_url,
        selfie_url: user.kyc_document.selfie_url
      } : undefined,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    }));

    const totalPages = Math.ceil(total / perPage);

    return {
      users,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Get detail of a user
   */
  async getUserById(id: string): Promise<UserDTO> {
    const user = await prisma.users.findFirst({
      where: { id, deleted_at: null },
    });

    if (!user) {
      throw new AppError(404, ErrorCode.USER_NOT_FOUND, 'Pengguna tidak ditemukan');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      company_name: user.company_name || undefined,
      npwp: user.npwp || undefined,
      pks_number: user.pks_number || undefined,
      provider_type: user.provider_type || undefined,
      address: user.address || undefined,
      npwp_url: user.npwp_url || undefined,
      provider_status: user.provider_status || undefined,
      occupation: user.occupation || undefined,
      bank_name: user.bank_name || undefined,
      bank_account_no: user.bank_account_no || undefined,
      bank_account_name: user.bank_account_name || undefined,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }

  /**
   * Update user profile information
   */
  async updateUser(id: string, data: Partial<UserDTO>): Promise<UserDTO> {
    const user = await prisma.users.findFirst({
      where: { id, deleted_at: null },
    });

    if (!user) {
      throw new AppError(404, ErrorCode.USER_NOT_FOUND, 'Pengguna tidak ditemukan');
    }

    // If user requests to register as provider or is already a provider, keep providers table in sync
    let providerStatus = user.provider_status;
    if (data.role === 'provider' || user.role === 'provider') {
      if (data.role === 'provider' && user.role !== 'provider') {
        // Validate mandatory fields for Provider registration (relaxed NPWP/company name)
        const missingFields = [];
        if (!data.address && !user.address) missingFields.push('Alamat');
        
        if (missingFields.length > 0) {
          throw new AppError(400, ErrorCode.BAD_REQUEST, `Kelengkapan data Provider belum diisi: ${missingFields.join(', ')}`);
        }

        providerStatus = 'pending';
      }

      // Keep the relational `providers` application row in sync
      await prisma.providers.upsert({
        where: { user_id: id },
        create: {
          user_id: id,
          status: providerStatus === 'pending' ? 'antri' : 'aktif',
          company_name: data.company_name ?? user.company_name ?? undefined,
          npwp: data.npwp ?? user.npwp ?? undefined,
          npwp_url: data.npwp_url ?? user.npwp_url ?? undefined,
          pks_number: data.pks_number ?? user.pks_number ?? undefined,
          provider_type: data.provider_type ?? user.provider_type ?? undefined,
          address: data.address ?? user.address ?? undefined,
          bank_name: data.bank_name ?? user.bank_name ?? undefined,
          bank_account_no: data.bank_account_no ?? user.bank_account_no ?? undefined,
          bank_account_name: data.bank_account_name ?? user.bank_account_name ?? undefined,
        },
        update: {
          status: data.role === 'provider' && user.role !== 'provider' ? 'antri' : undefined,
          company_name: data.company_name ?? undefined,
          npwp: data.npwp ?? undefined,
          npwp_url: data.npwp_url ?? undefined,
          pks_number: data.pks_number ?? undefined,
          provider_type: data.provider_type ?? undefined,
          address: data.address ?? undefined,
          bank_name: data.bank_name ?? undefined,
          bank_account_no: data.bank_account_no ?? undefined,
          bank_account_name: data.bank_account_name ?? undefined,
        },
      });
    }

    const updated = await prisma.users.update({
      where: { id },
      data: {
        full_name: data.full_name ?? user.full_name,
        phone: data.phone ?? user.phone,
        company_name: data.company_name ?? user.company_name,
        npwp: data.npwp ?? user.npwp,
        address: data.address ?? user.address,
        npwp_url: data.npwp_url ?? user.npwp_url,
        pks_number: data.pks_number ?? user.pks_number,
        provider_type: data.provider_type ?? user.provider_type,
        occupation: data.occupation ?? user.occupation,
        bank_name: data.bank_name ?? user.bank_name,
        bank_account_no: data.bank_account_no ?? user.bank_account_no,
        bank_account_name: data.bank_account_name ?? user.bank_account_name,
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      phone: updated.phone,
      full_name: updated.full_name,
      role: updated.role,
      status: updated.status,
      company_name: updated.company_name || undefined,
      npwp: updated.npwp || undefined,
      pks_number: updated.pks_number || undefined,
      provider_type: updated.provider_type || undefined,
      address: updated.address || undefined,
      npwp_url: updated.npwp_url || undefined,
      provider_status: updated.provider_status || undefined,
      occupation: updated.occupation || undefined,
      bank_name: updated.bank_name || undefined,
      bank_account_no: updated.bank_account_no || undefined,
      bank_account_name: updated.bank_account_name || undefined,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  /**
   * Admin updates user status (e.g. active, suspended)
   */
  async updateUserStatus(id: string, status: UserStatus): Promise<UserDTO> {
    const user = await prisma.users.findFirst({
      where: { id, deleted_at: null },
    });

    if (!user) {
      throw new AppError(404, ErrorCode.USER_NOT_FOUND, 'Pengguna tidak ditemukan');
    }

    const updated = await prisma.users.update({
      where: { id },
      data: { status: status as any },
    });

    return {
      id: updated.id,
      email: updated.email,
      phone: updated.phone,
      full_name: updated.full_name,
      role: updated.role,
      status: updated.status,
      company_name: updated.company_name || undefined,
      npwp: updated.npwp || undefined,
      provider_status: updated.provider_status || undefined,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  /**
   * Admin approves/rejects provider upgrade request
   */
  async updateProviderStatus(
    id: string,
    status?: string,
    feeConfig?: {
      provider_fee_type?: string;
      provider_fee_amount?: number;
      pmk41_paid_by_provider?: boolean;
    },
    rejectionReason?: string,
    reviewerId?: string
  ): Promise<UserDTO> {
    const user = await prisma.users.findFirst({
      where: { id, deleted_at: null },
    });

    if (!user) {
      throw new AppError(404, ErrorCode.USER_NOT_FOUND, 'Pengguna tidak ditemukan');
    }

    const updateData: any = {};
    if (status) {
      updateData.provider_status = status;
      updateData.role = status === 'approved' ? 'provider' : 'bidder';
    }

    if (status === 'approved') {
      await prisma.providers.updateMany({
        where: { user_id: id },
        data: {
          status: 'aktif',
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          rejection_reason: null,
          ...(feeConfig?.provider_fee_type !== undefined ? { provider_fee_type: feeConfig.provider_fee_type } : {}),
          ...(feeConfig?.provider_fee_amount !== undefined
            ? { provider_fee_amount: new Prisma.Decimal(feeConfig.provider_fee_amount) }
            : {}),
          ...(feeConfig?.pmk41_paid_by_provider !== undefined
            ? { pmk41_paid_by_provider: feeConfig.pmk41_paid_by_provider }
            : {}),
        },
      });
      // A provider becoming active can no longer bid — deactivate any bidder profile.
      await prisma.bidders.updateMany({
        where: { user_id: id, status: 'aktif' },
        data: { status: 'nonaktif' },
      });
      await notificationsService.createNotification({
        userId: id,
        type: 'provider_approved',
        title: 'Upgrade Provider Disetujui',
        body: 'Selamat, pengajuan upgrade akun Anda menjadi Mitra Provider Aset telah disetujui. Silakan login kembali untuk mengakses panel provider.',
      });
    } else if (status === 'rejected') {
      await prisma.providers.updateMany({
        where: { user_id: id },
        data: {
          status: 'ditolak',
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          rejection_reason: rejectionReason || 'Dokumen tidak lengkap',
        },
      });
      await notificationsService.createNotification({
        userId: id,
        type: 'provider_rejected',
        title: 'Upgrade Provider Ditolak',
        body: `Pengajuan upgrade akun menjadi Provider ditolak. Alasan: ${rejectionReason || 'Dokumen tidak lengkap'}. Silakan ajukan kembali.`,
      });
    }

    if (feeConfig?.provider_fee_type !== undefined) updateData.provider_fee_type = feeConfig.provider_fee_type;
    if (feeConfig?.provider_fee_amount !== undefined) updateData.provider_fee_amount = feeConfig.provider_fee_amount;
    if (feeConfig?.pmk41_paid_by_provider !== undefined) updateData.pmk41_paid_by_provider = feeConfig.pmk41_paid_by_provider;

    const updated = await prisma.users.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updated.id,
      email: updated.email,
      phone: updated.phone,
      full_name: updated.full_name,
      role: updated.role,
      status: updated.status,
      company_name: updated.company_name || undefined,
      npwp: updated.npwp || undefined,
      provider_status: updated.provider_status || undefined,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  /**
   * Admin creates a new user (bidder or provider)
   */
  async createUser(data: any): Promise<UserDTO> {
    const existingEmail = await prisma.users.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      if (existingEmail.status === UserStatus.PENDING) {
        await prisma.users.delete({ where: { id: existingEmail.id } }).catch(() => {});
      } else {
        throw new AppError(409, ErrorCode.USER_ALREADY_EXISTS, 'Email sudah terdaftar');
      }
    }

    if (data.phone) {
      const existingPhone = await prisma.users.findUnique({
        where: { phone: data.phone },
      });
      if (existingPhone) {
        if (existingPhone.status === UserStatus.PENDING) {
          await prisma.users.delete({ where: { id: existingPhone.id } }).catch(() => {});
        } else {
          throw new AppError(409, ErrorCode.USER_ALREADY_EXISTS, 'Nomor telepon sudah terdaftar');
        }
      }
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.users.create({
      data: {
        email: data.email,
        phone: data.phone || null,
        password_hash: passwordHash,
        full_name: data.full_name,
        role: data.role || Role.BIDDER,
        status: UserStatus.ACTIVE,
        company_name: data.company_name || null,
        npwp: data.npwp || null,
        provider_status: data.role === Role.PROVIDER ? 'approved' : (data.provider_status || null),
        provider_fee_type: data.provider_fee_type || null,
        provider_fee_amount: data.provider_fee_amount ? new Prisma.Decimal(data.provider_fee_amount) : null,
        pmk41_paid_by_provider: data.pmk41_paid_by_provider || false,
        address: data.address || null,
        occupation: data.occupation || null,
        bank_name: data.bank_name || null,
        bank_account_no: data.bank_account_no || null,
        bank_account_name: data.bank_account_name || null,
        npwp_url: data.npwp_url || null,
      },
    });

    if (data.ktp_url || data.selfie_url) {
      await prisma.kyc_documents.create({
        data: {
          user_id: user.id,
          ktp_url: data.ktp_url || null,
          selfie_url: data.selfie_url || null,
          status: 'approved',
          reviewed_at: new Date(),
        },
      });
    }

    // Admin-created accounts are immediately active ONLY IF KYC is provided.
    // Otherwise, they are put in "antri" (pending KYC) state.
    const isKycComplete = !!(data.ktp_url || data.selfie_url);
    const initialStatus = isKycComplete ? 'aktif' : 'antri';

    if (user.role === Role.PROVIDER) {
      await prisma.providers.create({
        data: {
          user_id: user.id,
          status: initialStatus,
          company_name: data.company_name || null,
          npwp: data.npwp || null,
          npwp_url: data.npwp_url || null,
          provider_fee_type: data.provider_fee_type || null,
          provider_fee_amount: data.provider_fee_amount ? new Prisma.Decimal(data.provider_fee_amount) : null,
          pmk41_paid_by_provider: data.pmk41_paid_by_provider || false,
          address: data.address || null,
          bank_name: data.bank_name || null,
          bank_account_no: data.bank_account_no || null,
          bank_account_name: data.bank_account_name || null,
          reviewed_at: isKycComplete ? new Date() : null,
        },
      });
    } else {
      await prisma.bidders.create({
        data: {
          user_id: user.id,
          status: initialStatus,
          address: data.address || null,
          occupation: data.occupation || null,
          bank_name: data.bank_name || null,
          bank_account_no: data.bank_account_no || null,
          bank_account_name: data.bank_account_name || null,
          reviewed_at: isKycComplete ? new Date() : null,
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }

  /**
   * Admin updates user details (without password change)
   */
  async adminUpdateUser(id: string, data: any): Promise<UserDTO> {
    const user = await prisma.users.findFirst({
      where: { id },
    });

    if (!user) {
      throw new AppError(404, ErrorCode.USER_NOT_FOUND, 'Pengguna tidak ditemukan');
    }

    // check if new email or phone exists
    if (data.email && data.email !== user.email) {
      const existingEmail = await prisma.users.findUnique({
        where: { email: data.email },
      });
      if (existingEmail && existingEmail.id !== user.id) {
        throw new AppError(409, ErrorCode.USER_ALREADY_EXISTS, 'Email sudah terdaftar');
      }
    }

    if (data.phone && data.phone !== user.phone) {
      const existingPhone = await prisma.users.findUnique({
        where: { phone: data.phone },
      });
      if (existingPhone && existingPhone.id !== user.id) {
        throw new AppError(409, ErrorCode.USER_ALREADY_EXISTS, 'Nomor telepon sudah terdaftar');
      }
    }

    const updated = await prisma.users.update({
      where: { id },
      data: {
        full_name: data.full_name ?? user.full_name,
        email: data.email ?? user.email,
        phone: data.phone ?? user.phone,
        role: data.role ?? user.role,
        status: data.status ?? user.status,
        company_name: data.company_name !== undefined ? data.company_name : user.company_name,
        npwp: data.npwp !== undefined ? data.npwp : user.npwp,
        provider_status: data.provider_status !== undefined ? data.provider_status : user.provider_status,
      },
    });

    // Sync fields that live in both users and providers tables
    // This ensures the provider list page (which reads providers table) reflects the changes
    const providerUpdateData: Record<string, unknown> = {};
    if (data.company_name !== undefined) providerUpdateData.company_name = data.company_name;
    if (data.npwp !== undefined) providerUpdateData.npwp = data.npwp;
    if (data.provider_fee_type !== undefined) providerUpdateData.provider_fee_type = data.provider_fee_type;
    if (data.provider_fee_amount !== undefined) providerUpdateData.provider_fee_amount = Number(data.provider_fee_amount);
    if (data.pmk41_paid_by_provider !== undefined) providerUpdateData.pmk41_paid_by_provider = data.pmk41_paid_by_provider;

    if (Object.keys(providerUpdateData).length > 0) {
      await prisma.providers.updateMany({
        where: { user_id: id },
        data: providerUpdateData,
      });
    }

    return {
      id: updated.id,
      email: updated.email,
      phone: updated.phone,
      full_name: updated.full_name,
      role: updated.role,
      status: updated.status,
      company_name: updated.company_name || undefined,
      npwp: updated.npwp || undefined,
      provider_status: updated.provider_status || undefined,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }


  /**
   * Admin soft deletes a user
   */
  async deleteUser(id: string): Promise<void> {
    const user = await prisma.users.findFirst({
      where: { id, deleted_at: null },
    });

    if (!user) {
      throw new AppError(404, ErrorCode.USER_NOT_FOUND, 'Pengguna tidak ditemukan');
    }

    // 1. Check if bidder has uploaded transfer proof but not approved yet
    const pendingDeposit = await prisma.deposits.findFirst({
      where: {
        user_id: id,
        status: 'pending_approval',
      },
    });
    if (pendingDeposit) {
      throw new AppError(400, ErrorCode.PENDING_DEPOSIT_APPROVAL, 'Pengguna memiliki bukti transfer deposit yang belum disetujui admin');
    }

    // 2. Check if bidder still has active NIPL codes
    const activeNipl = await prisma.nipl_codes.findFirst({
      where: {
        status: 'active',
        deposit: {
          user_id: id,
        },
      },
    });
    if (activeNipl) {
      throw new AppError(400, ErrorCode.ACTIVE_NIPL_EXISTS, 'Pengguna masih memiliki NIPL aktif yang belum digunakan atau direfund');
    }

    // 3. Check if bidder still has unpaid and unexpired invoices
    const unpaidInvoice = await prisma.invoices.findFirst({
      where: {
        bidder_id: id,
        status: { in: ['unpaid', 'pending_approval'] },
        due_date: {
          gt: new Date(),
        },
      },
    });
    if (unpaidInvoice) {
      throw new AppError(400, ErrorCode.UNPAID_INVOICE_EXISTS, 'Pengguna masih memiliki tagihan lelang yang belum dibayar dan belum kedaluwarsa');
    }

    // 4. Check if provider still has pending settlements
    const pendingSettlement = await prisma.settlements.findFirst({
      where: {
        provider_id: id,
        status: 'pending',
      },
    });
    if (pendingSettlement) {
      throw new AppError(400, ErrorCode.PENDING_SETTLEMENT_EXISTS, 'Penyedia masih memiliki settlement yang belum dicairkan');
    }

    await prisma.$transaction([
      prisma.bidders.deleteMany({ where: { user_id: id } }),
      prisma.providers.deleteMany({ where: { user_id: id } }),
      prisma.kyc_documents.deleteMany({ where: { user_id: id } }),
      prisma.users.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          status: UserStatus.SUSPENDED,
          email: `deleted-${id}@deleted.indo-lelang`,
          phone: null,
        },
      }),
    ]);
  }
}
