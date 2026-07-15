import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { AssetDTO, PaginationMeta, AssetStatus, AssetCategory, NotificationType } from '@indo-lelang/shared-types';
import { Prisma } from '@prisma/client';
import { notificationsService } from '../notifications/notifications.service';
import { notifyAdmins } from '../../lib/notifyAdmins';

const parseOptionalInt = (val: any) => {
  if (val === undefined) return undefined;
  if (val === null || val === 'N/A' || val === 'n/a' || val === '') return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
};

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
    providerId?: string,
    branchId?: string,
    poolStatus?: string,
    dateFrom?: string,
    dateTo?: string,
    policeNumber?: string
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
    if (branchId) {
      where.branch_id = branchId;
    }
    if (poolStatus) {
      where.pool_status = poolStatus;
    }
    if (policeNumber) {
      where.police_number = { contains: policeNumber, mode: 'insensitive' };
    }
    if (dateFrom || dateTo) {
      where.created_at = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const skip = (page - 1) * perPage;

    const [total, records] = await Promise.all([
      prisma.assets.count({ where }),
      prisma.assets.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
        include: {
          provider: {
            select: { full_name: true, company_name: true }
          }
        }
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
        // category/title/base_price are NOT NULL columns with no DB default,
        // so "making the form optional" means falling back here rather than
        // letting Prisma throw when a field is left blank.
        category: (data.category || 'mobil') as any,
        title: data.title && String(data.title).trim() ? data.title : 'Unit Tanpa Nama',
        description: data.description || null,
        base_price: new Prisma.Decimal(data.base_price || 0),
        images: data.images ? (typeof data.images === 'string' ? data.images : JSON.stringify(data.images)) : '{}',
        status: AssetStatus.PENDING,

        brand: data.brand || null,
        model: data.model || null,
        color: data.color || null,
        fuel_type: data.fuel_type || null,
        transmission: data.transmission || null,
        body_type: data.body_type || null,
        year: parseOptionalInt(data.year),
        police_number: data.police_number || null,
        bpkb_number: data.bpkb_number || null,
        frame_number: data.frame_number || null,
        cylinder: parseOptionalInt(data.cylinder),
        odometer: parseOptionalInt(data.odometer),
        
        is_recommended: data.is_recommended === true || data.is_recommended === 'true' ? true : false,
        engine_number: data.engine_number || null,
        created_by_admin: data.created_by_admin || false,
        
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

        branch_id: data.branch_id || null,
        pool_status: data.pool_status || 'in_pool',
        notes: data.notes || null,
        photo_front: data.photo_front || null,
        photo_back: data.photo_back || null,
        photo_right: data.photo_right || null,
        photo_left: data.photo_left || null,
        photo_engine: data.photo_engine || null,
        photo_interior: data.photo_interior || null,
        photo_stnk: data.photo_stnk || null,
      } as any,
    });

    const provider = await prisma.users.findUnique({ where: { id: providerId }, select: { full_name: true, company_name: true } });
    await notifyAdmins(
      'asset_submitted',
      'Pengajuan Barang Titip Jual Baru',
      `${provider?.company_name || provider?.full_name || 'Provider'} mengajukan "${a.title}" untuk dititipjualkan. Mohon diinspeksi.`,
      '/assets/inspection'
    );

    return {
      ...a,
      base_price: Number(a.base_price),
      images: a.images ? JSON.parse(a.images as string) : {},
      created_at: a.created_at.toISOString(),
      updated_at: a.updated_at.toISOString(),
    } as any;
  }

  /**
   * Inspect asset (Inspector submits inspection details)
   */
  async inspectAsset(id: string, data: any, inspectorId: string): Promise<AssetDTO> {
    const asset = await prisma.assets.findUnique({ where: { id } });

    if (!asset) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Aset barang tidak ditemukan');
    }

    if (asset.status !== AssetStatus.PENDING) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Hanya barang berstatus PENDING yang dapat diinspeksi');
    }

    const updated = await prisma.assets.update({
      where: { id },
      data: {
        status: AssetStatus.INSPECTED,
        inspector_id: inspectorId,
        // Inspection date is optional in the form; default to "now" rather
        // than writing an Invalid Date when it's left blank.
        inspection_date: data.inspection_date ? new Date(data.inspection_date) : new Date(),
        inspection_pic_name: data.inspection_pic_name,
        grade_interior: data.grade_interior,
        grade_exterior: data.grade_exterior,
        grade_engine: data.grade_engine,
        inspection_doc_url: data.inspection_doc_url || null,
        
        category: data.category,
        brand: data.brand,
        model: data.model,
        color: data.color,
        fuel_type: data.fuel_type,
        transmission: data.transmission,
        body_type: data.body_type,
        year: parseOptionalInt(data.year),
        police_number: data.police_number,
        bpkb_number: data.bpkb_number,
        frame_number: data.frame_number,
        cylinder: parseOptionalInt(data.cylinder),
        odometer: parseOptionalInt(data.odometer),
      } as any,
    });

    return {
      ...updated,
      base_price: Number(updated.base_price),
      images: updated.images ? JSON.parse(updated.images as string) : {},
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
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
        year: parseOptionalInt(data.year),
        police_number: data.police_number ?? undefined,
        bpkb_number: data.bpkb_number ?? undefined,
        frame_number: data.frame_number ?? undefined,
        cylinder: parseOptionalInt(data.cylinder),
        odometer: parseOptionalInt(data.odometer),
        
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

        branch_id: data.branch_id !== undefined ? data.branch_id : undefined,
        pool_status: data.pool_status ?? undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        rejection_reason: data.rejection_reason !== undefined ? data.rejection_reason : undefined,
        photo_front: data.photo_front !== undefined ? data.photo_front : undefined,
        photo_back: data.photo_back !== undefined ? data.photo_back : undefined,
        photo_right: data.photo_right !== undefined ? data.photo_right : undefined,
        photo_left: data.photo_left !== undefined ? data.photo_left : undefined,
        photo_engine: data.photo_engine !== undefined ? data.photo_engine : undefined,
        photo_interior: data.photo_interior !== undefined ? data.photo_interior : undefined,
        photo_stnk: data.photo_stnk !== undefined ? data.photo_stnk : undefined,
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
      branch_id: (updated as any).branch_id || undefined,
      pool_status: (updated as any).pool_status || undefined,
      notes: (updated as any).notes || undefined,
      rejection_reason: (updated as any).rejection_reason || undefined,
      photo_front: (updated as any).photo_front || undefined,
      photo_back: (updated as any).photo_back || undefined,
      photo_right: (updated as any).photo_right || undefined,
      photo_left: (updated as any).photo_left || undefined,
      photo_engine: (updated as any).photo_engine || undefined,
      photo_interior: (updated as any).photo_interior || undefined,
      photo_stnk: (updated as any).photo_stnk || undefined,
      created_by_admin: updated.created_by_admin,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  /**
   * Approve asset (Admin/Operator only)
   */
  async approveAsset(id: string): Promise<AssetDTO> {
    const asset = await prisma.assets.findUnique({ where: { id } });
    if (!asset) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Aset barang tidak ditemukan');
    }
    if (asset.status !== AssetStatus.INSPECTED) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Aset barang harus diinspeksi terlebih dahulu');
    }
    const updated = await this.updateAsset(id, { status: AssetStatus.APPROVED });

    await notificationsService.createNotification({
      userId: updated.provider_id,
      type: NotificationType.ASSET_APPROVED,
      title: 'Pengajuan Barang Disetujui',
      body: `Selamat, pengajuan titip jual "${updated.title}" telah disetujui dan siap masuk penyusunan lot.`,
    });

    return updated;
  }

  /**
   * Reject asset during inspection review (Admin/Operator only)
   */
  async rejectAsset(id: string, reason: string): Promise<AssetDTO> {
    const updated = await this.updateAsset(id, {
      status: AssetStatus.REJECTED,
      rejection_reason: reason,
    });

    await notificationsService.createNotification({
      userId: updated.provider_id,
      type: NotificationType.ASSET_REJECTED,
      title: 'Pengajuan Barang Ditolak',
      body: `Pengajuan titip jual "${updated.title}" ditolak. Alasan: ${reason}. Anda dapat mengedit dan mengajukan kembali.`,
    });

    return updated;
  }

  /**
   * Provider/Admin withdraws an approved/listed asset before it's auctioned ("dikembalikan").
   */
  async returnAsset(id: string): Promise<AssetDTO> {
    const asset = await prisma.assets.findUnique({ where: { id } });
    if (!asset) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Aset barang tidak ditemukan');
    }
    if (![AssetStatus.APPROVED, AssetStatus.LISTED].includes(asset.status as AssetStatus)) {
      throw new AppError(
        400,
        ErrorCode.VALIDATION_ERROR,
        'Hanya barang berstatus disetujui/terdaftar yang dapat dikembalikan'
      );
    }
    return this.updateAsset(id, { status: AssetStatus.RETURNED });
  }

  /**
   * Delete asset. Providers may only delete their own submissions while
   * still in "ditolak" (rejected) status; admin/inspector roles keep
   * unrestricted delete for back-office cleanup.
   */
  async deleteAsset(id: string, caller?: { role: string; userId: string }): Promise<void> {
    const asset = await prisma.assets.findUnique({ where: { id } });
    if (!asset) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Aset barang tidak ditemukan');
    }

    if (caller?.role === 'provider') {
      if (asset.provider_id !== caller.userId) {
        throw new AppError(403, ErrorCode.FORBIDDEN, 'Anda hanya dapat menghapus barang milik Anda sendiri');
      }
      if (asset.status !== AssetStatus.REJECTED) {
        throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Hanya barang berstatus ditolak yang dapat dihapus');
      }
    } else if (caller && caller.role !== 'provider') {
      if (!asset.created_by_admin) {
        throw new AppError(403, ErrorCode.FORBIDDEN, 'Admin tidak dapat menghapus barang yang diajukan oleh provider');
      }
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
