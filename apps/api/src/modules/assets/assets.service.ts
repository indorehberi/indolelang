import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { AssetDTO, PaginationMeta, AssetStatus, AssetCategory } from '@indo-lelang/shared-types';
import { Prisma } from '@prisma/client';

export class AssetsService {
  /**
   * Get list of assets (paginated, filtered, searched)
   */
  async getAssets(
    page: number,
    perPage: number,
    status?: string,
    category?: string,
    search?: string,
    providerId?: string
  ): Promise<{ assets: AssetDTO[]; meta: PaginationMeta }> {
    const where: Prisma.assetsWhereInput = {};

    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category as any;
    }
    if (providerId) {
      where.provider_id = providerId;
    }
    if (search) {
      where.title = { contains: search };
    }

    const skip = (page - 1) * perPage;

    const [total, records] = await Promise.all([
      prisma.assets.count({ where }),
      prisma.assets.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const assets: AssetDTO[] = records.map((a) => ({
      id: a.id,
      provider_id: a.provider_id,
      category: a.category,
      title: a.title,
      description: a.description || undefined,
      base_price: Number(a.base_price),
      images: a.images ? JSON.parse(a.images as string) : undefined,
      status: a.status,
      created_at: a.created_at.toISOString(),
      updated_at: a.updated_at.toISOString(),
    }));

    const totalPages = Math.ceil(total / perPage);

    return {
      assets,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Get asset details by ID
   */
  async getAssetById(id: string): Promise<AssetDTO> {
    const a = await prisma.assets.findUnique({
      where: { id },
    });

    if (!a) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Aset barang tidak ditemukan');
    }

    return {
      id: a.id,
      provider_id: a.provider_id,
      category: a.category,
      title: a.title,
      description: a.description || undefined,
      base_price: Number(a.base_price),
      images: a.images ? JSON.parse(a.images as string) : undefined,
      status: a.status,
      created_at: a.created_at.toISOString(),
      updated_at: a.updated_at.toISOString(),
    };
  }

  /**
   * Create a new asset (Provider submits a item)
   */
  async createAsset(data: any, providerId: string): Promise<AssetDTO> {
    const a = await prisma.assets.create({
      data: {
        provider_id: providerId,
        category: data.category as any,
        title: data.title,
        description: data.description || null,
        base_price: new Prisma.Decimal(data.base_price),
        images: data.images || '[]',
        status: AssetStatus.PENDING,
      },
    });

    return {
      id: a.id,
      provider_id: a.provider_id,
      category: a.category,
      title: a.title,
      description: a.description || undefined,
      base_price: Number(a.base_price),
      images: a.images ? JSON.parse(a.images as string) : undefined,
      status: a.status,
      created_at: a.created_at.toISOString(),
      updated_at: a.updated_at.toISOString(),
    };
  }

  /**
   * Update asset details
   */
  async updateAsset(id: string, data: any): Promise<AssetDTO> {
    const asset = await prisma.assets.findUnique({ where: { id } });
    if (!asset) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Aset barang tidak ditemukan');
    }

    const updated = await prisma.assets.update({
      where: { id },
      data: {
        category: data.category ? (data.category as any) : undefined,
        title: data.title ?? undefined,
        description: data.description !== undefined ? data.description : undefined,
        base_price: data.base_price ? new Prisma.Decimal(data.base_price) : undefined,
        images: data.images ?? undefined,
        status: data.status ?? undefined,
      },
    });

    return {
      id: updated.id,
      provider_id: updated.provider_id,
      category: updated.category,
      title: updated.title,
      description: updated.description || undefined,
      base_price: Number(updated.base_price),
      images: updated.images ? JSON.parse(updated.images as string) : undefined,
      status: updated.status,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  /**
   * Approve asset (Admin/Operator only)
   */
  async approveAsset(id: string): Promise<AssetDTO> {
    return this.updateAsset(id, { status: AssetStatus.APPROVED });
  }

  /**
   * Reject asset / return to provider (Admin/Operator only)
   */
  async rejectAsset(id: string): Promise<AssetDTO> {
    return this.updateAsset(id, { status: AssetStatus.RETURNED });
  }
}
