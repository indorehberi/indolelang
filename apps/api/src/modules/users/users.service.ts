import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { UserDTO, PaginationMeta, Role, UserStatus } from '@indo-lelang/shared-types';
import { Prisma } from '@prisma/client';
import { hashPassword } from '../../lib/hash';
import { notificationsService } from '../notifications/notifications.service';
export class UsersService {
  /**
   * Get list of users with pagination and filtering (Admin only)
   */
  async getUsers(
    page: number,
    perPage: number,
    role?: Role,
    status?: UserStatus,
    search?: string,
    provider_status?: string
  ): Promise<{ users: UserDTO[]; meta: PaginationMeta }> {
    const where: Prisma.usersWhereInput = {
      deleted_at: null,
    };

    if (role) {
      where.role = role as any;
    }
    if (status) {
      where.status = status as any;
    }
    if (provider_status) {
      where.provider_status = provider_status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { phone: { contains: search } },
        { full_name: { contains: search } },
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
          kyc_documents: true
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
      active_nipl_count: user.deposits ? user.deposits.length : 0,
      kyc: user.kyc_documents ? {
        id: user.kyc_documents.id,
        status: user.kyc_documents.status,
        ktp_url: user.kyc_documents.ktp_url,
        selfie_url: user.kyc_documents.selfie_url
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

    // If user requests to register as provider, set status to pending and DO NOT change role yet
    let providerStatus = user.provider_status;
    if (data.role === 'provider') {
      // Validate mandatory fields for Provider
      const missingFields = [];
      if (!data.company_name && !user.company_name) missingFields.push('Nama Perusahaan');
      if (!data.npwp && !user.npwp) missingFields.push('NPWP');
      if (!data.pks_number && !user.pks_number) missingFields.push('No PKS');
      if (!data.provider_type && !user.provider_type) missingFields.push('Jenis Provider');
      if (!data.address && !user.address) missingFields.push('Alamat');
      if (!data.npwp_url && !user.npwp_url) missingFields.push('Upload NPWP');
      
      if (missingFields.length > 0) {
        throw new AppError(400, ErrorCode.BAD_REQUEST, `Kelengkapan data Provider belum diisi: ${missingFields.join(', ')}`);
      }

      providerStatus = 'pending';
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
        provider_status: providerStatus,
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
    rejectionReason?: string
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
      await notificationsService.createNotification({
        userId: id,
        type: 'provider_approved',
        title: 'Upgrade Provider Disetujui',
        body: 'Selamat, pengajuan upgrade akun Anda menjadi Mitra Provider Aset telah disetujui. Silakan login kembali untuk mengakses panel provider.',
      });
    } else if (status === 'rejected') {
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
      where: { id, deleted_at: null },
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

    await prisma.users.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        status: UserStatus.SUSPENDED, // suspend as well when deleted
      },
    });
  }
}
