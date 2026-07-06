import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { LotDTO, PaginationMeta, LotStatus, AssetStatus } from '@indo-lelang/shared-types';
import { Prisma } from '@prisma/client';

export class LotsService {
  /**
   * Get list of lots (paginated, filtered)
   */
  async getLots(
    page: number,
    perPage: number,
    sessionId?: string,
    status?: string,
    providerId?: string
  ): Promise<{ lots: any[]; meta: PaginationMeta }> {
    const where: Prisma.lotsWhereInput = {};

    if (status) {
      if (status.includes(',')) {
        where.status = { in: status.split(',') as any };
      } else {
        where.status = status as any;
      }
    }
    if (sessionId) {
      where.session_id = sessionId;
    }
    if (providerId) {
      where.asset = { provider_id: providerId };
    }

    const skip = (page - 1) * perPage;

    const [total, records] = await Promise.all([
      prisma.lots.count({ where }),
      prisma.lots.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { lot_number: 'asc' },
        include: {
          asset: true,
          session: {
            include: {
              branch: true,
            },
          },
          winner: {
            select: {
              full_name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    const lots = records.map((l: any) => ({
      id: l.id,
      session_id: l.session_id,
      asset_id: l.asset_id,
      lot_number: l.lot_number,
      starting_price: Number(l.starting_price),
      hammer_price: l.hammer_price ? Number(l.hammer_price) : undefined,
      winner_id: l.winner_id || undefined,
      status: l.status,
      asset: {
        id: l.asset.id,
        provider_id: l.asset.provider_id,
        category: l.asset.category,
        title: l.asset.title,
        description: l.asset.description || undefined,
        base_price: Number(l.asset.base_price),
        images: l.asset.images ? JSON.parse(l.asset.images as string) : undefined,
        status: l.asset.status,
        brand: l.asset.brand || undefined,
        model: l.asset.model || undefined,
        year: l.asset.year ? Number(l.asset.year) : undefined,
        police_number: l.asset.police_number || undefined,
        created_at: l.asset.created_at.toISOString(),
        updated_at: l.asset.updated_at.toISOString(),
      },
      session: l.session ? {
        id: l.session.id,
        title: l.session.title,
        scheduled_at: l.session.scheduled_at.toISOString(),
        status: l.session.status,
        branch: l.session.branch ? {
          name: l.session.branch.name,
          city: l.session.branch.city,
        } : undefined,
      } : undefined,
      winner: l.winner ? {
        full_name: l.winner.full_name,
        email: l.winner.email,
        phone: l.winner.phone,
      } : undefined,
      created_at: l.created_at.toISOString(),
      updated_at: l.updated_at.toISOString(),
    }));

    const totalPages = Math.ceil(total / perPage);

    return {
      lots,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Get lot details by ID
   */
  async getLotById(id: string): Promise<LotDTO> {
    const l = await prisma.lots.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!l) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Lot lelang tidak ditemukan');
    }

    return {
      id: l.id,
      session_id: l.session_id,
      asset_id: l.asset_id,
      lot_number: l.lot_number,
      starting_price: Number(l.starting_price),
      hammer_price: l.hammer_price ? Number(l.hammer_price) : undefined,
      winner_id: l.winner_id || undefined,
      status: l.status,
      asset: {
        id: l.asset.id,
        provider_id: l.asset.provider_id,
        category: l.asset.category,
        title: l.asset.title,
        description: l.asset.description || undefined,
        base_price: Number(l.asset.base_price),
        images: l.asset.images ? JSON.parse(l.asset.images as string) : undefined,
        status: l.asset.status,
        created_at: l.asset.created_at.toISOString(),
        updated_at: l.asset.updated_at.toISOString(),
      },
      created_at: l.created_at.toISOString(),
      updated_at: l.updated_at.toISOString(),
    };
  }

  /**
   * Create a new lot (Assigns asset to a session, sets status to pending)
   */
  async createLot(data: any): Promise<LotDTO> {
    // 1. Verify session exists
    const session = await prisma.auction_sessions.findUnique({ where: { id: data.session_id } });
    if (!session) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Sesi lelang tidak ditemukan');
    }

    // 2. Verify asset exists and is approved
    const asset = await prisma.assets.findUnique({ where: { id: data.asset_id } });
    if (!asset) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Barang tidak ditemukan');
    }

    if (asset.status !== AssetStatus.APPROVED) {
      throw new AppError(
        400,
        ErrorCode.VALIDATION_ERROR,
        'Barang harus disetujui (approved) sebelum dimasukkan ke dalam lot lelang'
      );
    }

    // 3. Perform database operations in transaction
    const [lot] = await prisma.$transaction([
      prisma.lots.create({
        data: {
          session_id: data.session_id,
          asset_id: data.asset_id,
          lot_number: data.lot_number,
          starting_price: new Prisma.Decimal(data.starting_price),
          status: LotStatus.PENDING,
        },
        include: { asset: true },
      }),
      // Update asset status to listed
      prisma.assets.update({
        where: { id: data.asset_id },
        data: { status: AssetStatus.LISTED },
      }),
    ]);

    return {
      id: lot.id,
      session_id: lot.session_id,
      asset_id: lot.asset_id,
      lot_number: lot.lot_number,
      starting_price: Number(lot.starting_price),
      hammer_price: lot.hammer_price ? Number(lot.hammer_price) : undefined,
      winner_id: lot.winner_id || undefined,
      status: lot.status,
      asset: {
        id: lot.asset.id,
        provider_id: lot.asset.provider_id,
        category: lot.asset.category,
        title: lot.asset.title,
        description: lot.asset.description || undefined,
        base_price: Number(lot.asset.base_price),
        images: lot.asset.images ? JSON.parse(lot.asset.images as string) : undefined,
        status: lot.asset.status,
        created_at: lot.asset.created_at.toISOString(),
        updated_at: lot.asset.updated_at.toISOString(),
      },
      created_at: lot.created_at.toISOString(),
      updated_at: lot.updated_at.toISOString(),
    };
  }

  /**
   * Update lot details
   */
  async updateLot(id: string, data: any): Promise<LotDTO> {
    const lot = await prisma.lots.findUnique({ where: { id } });
    if (!lot) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Lot lelang tidak ditemukan');
    }

    const updated = await prisma.lots.update({
      where: { id },
      data: {
        session_id: data.session_id ?? undefined,
        asset_id: data.asset_id ?? undefined,
        lot_number: data.lot_number ?? undefined,
        starting_price: data.starting_price ? new Prisma.Decimal(data.starting_price) : undefined,
        hammer_price: data.hammer_price ? new Prisma.Decimal(data.hammer_price) : undefined,
        winner_id: data.winner_id ?? undefined,
        status: data.status ?? undefined,
      },
      include: { asset: true },
    });

    return {
      id: updated.id,
      session_id: updated.session_id,
      asset_id: updated.asset_id,
      lot_number: updated.lot_number,
      starting_price: Number(updated.starting_price),
      hammer_price: updated.hammer_price ? Number(updated.hammer_price) : undefined,
      winner_id: updated.winner_id || undefined,
      status: updated.status,
      asset: {
        id: updated.asset.id,
        provider_id: updated.asset.provider_id,
        category: updated.asset.category,
        title: updated.asset.title,
        description: updated.asset.description || undefined,
        base_price: Number(updated.asset.base_price),
        images: updated.asset.images ? JSON.parse(updated.asset.images as string) : undefined,
        status: updated.asset.status,
        created_at: updated.asset.created_at.toISOString(),
        updated_at: updated.asset.updated_at.toISOString(),
      },
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }
}
