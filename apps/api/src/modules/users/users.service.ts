import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { UserDTO, PaginationMeta, Role, UserStatus } from '@indo-lelang/shared-types';
import { Prisma } from '@prisma/client';

export class UsersService {
  /**
   * Get list of users with pagination and filtering (Admin only)
   */
  async getUsers(
    page: number,
    perPage: number,
    role?: Role,
    status?: UserStatus,
    search?: string
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
      }),
    ]);

    const users: UserDTO[] = records.map((user) => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      company_name: user.company_name || undefined,
      npwp: user.npwp || undefined,
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

    const updated = await prisma.users.update({
      where: { id },
      data: {
        full_name: data.full_name ?? user.full_name,
        phone: data.phone ?? user.phone,
        company_name: data.company_name ?? user.company_name,
        npwp: data.npwp ?? user.npwp,
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
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }
}
