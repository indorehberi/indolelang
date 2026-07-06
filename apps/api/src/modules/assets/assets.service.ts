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
      if (status.includes(',')) {
        where.status = { in: status.split(',') as any };
      } else {
        where.status = status;
      }
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

    const assets = records.map((a: any) => ({
      ...a,
      base_price: Number(a.base_price),
      images: a.images ? JSON.parse(a.images) : {},
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
      ...a,
      base_price: Number(a.base_price),
      images: a.images ? JSON.parse(a.images as string) : {},
      created_at: a.created_at.toISOString(),
      updated_at: a.updated_at.toISOString(),
    } as any;
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
        images: data.images ? (typeof data.images === 'string' ? data.images : JSON.stringify(data.images)) : '{}',
        status: AssetStatus.PENDING,

        brand: data.brand || null,
        model: data.model || null,
        color: data.color || null,
        fuel_type: data.fuel_type || null,
        transmission: data.transmission || null,
        body_type: data.body_type || null,
        year: data.year ? parseInt(data.year) : null,
        police_number: data.police_number || null,
        bpkb_number: data.bpkb_number || null,
        frame_number: data.frame_number || null,
        cylinder: data.cylinder ? parseInt(data.cylinder) : null,
        odometer: data.odometer ? parseInt(data.odometer) : null,
        
        is_recommended: data.is_recommended === true || data.is_recommended === 'true' ? true : false,
        engine_number: data.engine_number || null,
        
        stnk_date: data.stnk_date ? new Date(data.stnk_date) : null,
        stnk_tax_date: data.stnk_tax_date ? new Date(data.stnk_tax_date) : null,
        keur_date: data.keur_date ? new Date(data.keur_date) : null,
        
        doc_stnk: data.doc_stnk === true || data.doc_stnk === 'true' ? true : false,
        doc_bpkb: data.doc_bpkb === true || data.doc_bpkb === 'true' ? true : false,
        doc_faktur: data.doc_faktur === true || data.doc_faktur === 'true' ? true : false,
        doc_kwitansi: data.doc_kwitansi === true || data.doc_kwitansi === 'true' ? true : false,
        doc_form_a: data.doc_form_a === true || data.doc_form_a === 'true' ? true : false,
        doc_copy_ktp: data.doc_copy_ktp === true || data.doc_copy_ktp === 'true' ? true : false,
        doc_keur: data.doc_keur === true || data.doc_keur === 'true' ? true : false,
        doc_sph: data.doc_sph === true || data.doc_sph === 'true' ? true : false,
      } as any,
    });

    return {
      ...a,
      base_price: Number(a.base_price),
      images: a.images ? JSON.parse(a.images as string) : {},
      created_at: a.created_at.toISOString(),
      updated_at: a.updated_at.toISOString(),
    } as any;
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
        images: data.images ? (typeof data.images === 'string' ? data.images : JSON.stringify(data.images)) : undefined,
        status: data.status ?? undefined,
        
        brand: data.brand ?? undefined,
        model: data.model ?? undefined,
        color: data.color ?? undefined,
        fuel_type: data.fuel_type ?? undefined,
        transmission: data.transmission ?? undefined,
        body_type: data.body_type ?? undefined,
        year: data.year ? parseInt(data.year) : undefined,
        police_number: data.police_number ?? undefined,
        bpkb_number: data.bpkb_number ?? undefined,
        frame_number: data.frame_number ?? undefined,
        cylinder: data.cylinder ? parseInt(data.cylinder) : undefined,
        odometer: data.odometer ? parseInt(data.odometer) : undefined,
        
        is_recommended: data.is_recommended !== undefined ? (data.is_recommended === true || data.is_recommended === 'true') : undefined,
        engine_number: data.engine_number ?? undefined,
        
        stnk_date: data.stnk_date ? new Date(data.stnk_date) : undefined,
        stnk_tax_date: data.stnk_tax_date ? new Date(data.stnk_tax_date) : undefined,
        keur_date: data.keur_date ? new Date(data.keur_date) : undefined,
        
        doc_stnk: data.doc_stnk !== undefined ? (data.doc_stnk === true || data.doc_stnk === 'true') : undefined,
        doc_bpkb: data.doc_bpkb !== undefined ? (data.doc_bpkb === true || data.doc_bpkb === 'true') : undefined,
        doc_faktur: data.doc_faktur !== undefined ? (data.doc_faktur === true || data.doc_faktur === 'true') : undefined,
        doc_kwitansi: data.doc_kwitansi !== undefined ? (data.doc_kwitansi === true || data.doc_kwitansi === 'true') : undefined,
        doc_form_a: data.doc_form_a !== undefined ? (data.doc_form_a === true || data.doc_form_a === 'true') : undefined,
        doc_copy_ktp: data.doc_copy_ktp !== undefined ? (data.doc_copy_ktp === true || data.doc_copy_ktp === 'true') : undefined,
        doc_keur: data.doc_keur !== undefined ? (data.doc_keur === true || data.doc_keur === 'true') : undefined,
        doc_sph: data.doc_sph !== undefined ? (data.doc_sph === true || data.doc_sph === 'true') : undefined,
      } as any,
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

  /**
   * Delete asset
   */
  async deleteAsset(id: string): Promise<void> {
    const asset = await prisma.assets.findUnique({ where: { id } });
    if (!asset) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Aset barang tidak ditemukan');
    }
    await prisma.assets.delete({ where: { id } });
  }

  /**
   * Re-review asset (set status back to pending)
   */
  async reviewAsset(id: string): Promise<AssetDTO> {
    return this.updateAsset(id, { status: AssetStatus.PENDING });
  }

  /**
   * Cancel approval (set status back to pending)
   */
  async cancelApproval(id: string): Promise<AssetDTO> {
    return this.updateAsset(id, { status: AssetStatus.PENDING });
  }
}
