import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { BranchDTO, PaginationMeta } from '@indo-lelang/shared-types';

export class BranchesService {
  /**
   * Get list of branches (paginated, filtered by active status)
   */
  async getBranches(
    page: number,
    perPage: number,
    tenantId = 'default',
    isActive?: boolean
  ): Promise<{ branches: BranchDTO[]; meta: PaginationMeta }> {
    const where: any = { tenant_id: tenantId };
    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    const skip = (page - 1) * perPage;

    const [total, records] = await Promise.all([
      prisma.branches.count({ where }),
      prisma.branches.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { name: 'asc' },
      }),
    ]);

    const branches: BranchDTO[] = records.map((branch) => ({
      id: branch.id,
      tenant_id: branch.tenant_id,
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone,
      pic_name: branch.pic_name,
      is_active: branch.is_active,
      created_at: branch.created_at.toISOString(),
      updated_at: branch.updated_at.toISOString(),
    }));

    const totalPages = Math.ceil(total / perPage);

    return {
      branches,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Get branch details by ID
   */
  async getBranchById(id: string): Promise<BranchDTO> {
    const branch = await prisma.branches.findUnique({
      where: { id },
    });

    if (!branch) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Cabang tidak ditemukan');
    }

    return {
      id: branch.id,
      tenant_id: branch.tenant_id,
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone,
      pic_name: branch.pic_name,
      is_active: branch.is_active,
      created_at: branch.created_at.toISOString(),
      updated_at: branch.updated_at.toISOString(),
    };
  }

  /**
   * Create a new branch (Admin only)
   */
  async createBranch(data: any): Promise<BranchDTO> {
    const branch = await prisma.branches.create({
      data: {
        tenant_id: data.tenant_id ?? 'default',
        name: data.name,
        city: data.city,
        address: data.address,
        phone: data.phone,
        pic_name: data.pic_name,
        is_active: data.is_active ?? true,
      },
    });

    return {
      id: branch.id,
      tenant_id: branch.tenant_id,
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone,
      pic_name: branch.pic_name,
      is_active: branch.is_active,
      created_at: branch.created_at.toISOString(),
      updated_at: branch.updated_at.toISOString(),
    };
  }

  /**
   * Update branch details (Admin only)
   */
  async updateBranch(id: string, data: any): Promise<BranchDTO> {
    const branch = await prisma.branches.findUnique({
      where: { id },
    });

    if (!branch) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Cabang tidak ditemukan');
    }

    const updated = await prisma.branches.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        city: data.city ?? undefined,
        address: data.address ?? undefined,
        phone: data.phone ?? undefined,
        pic_name: data.pic_name ?? undefined,
        is_active: data.is_active ?? undefined,
      },
    });

    return {
      id: updated.id,
      tenant_id: updated.tenant_id,
      name: updated.name,
      city: updated.city,
      address: updated.address,
      phone: updated.phone,
      pic_name: updated.pic_name,
      is_active: updated.is_active,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }
}
