import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { LotDTO, PaginationMeta, LotStatus, AssetStatus, SessionStatus } from '@indo-lelang/shared-types';
import { Prisma } from '@prisma/client';
import { paymentsService } from '../payments/payments.service';
import { notifyAdmins } from '../../lib/notifyAdmins';

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
          invoices: {
            select: { id: true, status: true },
            take: 1,
            orderBy: { created_at: 'desc' },
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
        color: l.asset.color || undefined,
        transmission: l.asset.transmission || undefined,
        fuel_type: l.asset.fuel_type || undefined,
        body_type: l.asset.body_type || undefined,
        odometer: l.asset.odometer ? Number(l.asset.odometer) : undefined,
        cylinder: l.asset.cylinder ? Number(l.asset.cylinder) : undefined,
        photo_front: l.asset.photo_front || undefined,
        photo_back: l.asset.photo_back || undefined,
        photo_right: l.asset.photo_right || undefined,
        photo_left: l.asset.photo_left || undefined,
        photo_engine: l.asset.photo_engine || undefined,
        photo_interior: l.asset.photo_interior || undefined,
        photo_stnk: l.asset.photo_stnk || undefined,
        created_at: l.asset.created_at.toISOString(),
        updated_at: l.asset.updated_at.toISOString(),
      },
      session: l.session ? {
        id: l.session.id,
        branch_id: l.session.branch_id,
        title: l.session.title,
        scheduled_at: l.session.scheduled_at.toISOString(),
        status: l.session.status,
        branch: l.session.branch ? {
          id: l.session.branch.id,
          tenant_id: l.session.branch.tenant_id,
          name: l.session.branch.name,
          city: l.session.branch.city,
          address: l.session.branch.address,
          phone: l.session.branch.phone,
          pic_name: l.session.branch.pic_name,
          is_active: l.session.branch.is_active,
          created_at: l.session.branch.created_at.toISOString(),
          updated_at: l.session.branch.updated_at.toISOString(),
        } : undefined,
        created_at: l.session.created_at.toISOString(),
        updated_at: l.session.updated_at.toISOString(),
      } : undefined,
      winner: l.winner ? {
        full_name: l.winner.full_name,
        email: l.winner.email,
        phone: l.winner.phone,
      } : undefined,
      invoice_id: l.invoices?.[0]?.id,
      payment_status: l.invoices?.[0]?.status,
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
      include: { 
        asset: true,
        session: {
          include: { branch: true }
        }
      },
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
        brand: l.asset.brand || undefined,
        model: l.asset.model || undefined,
        year: l.asset.year ? Number(l.asset.year) : undefined,
        police_number: l.asset.police_number || undefined,
        color: l.asset.color || undefined,
        transmission: l.asset.transmission || undefined,
        fuel_type: l.asset.fuel_type || undefined,
        body_type: l.asset.body_type || undefined,
        odometer: l.asset.odometer ? Number(l.asset.odometer) : undefined,
        cylinder: l.asset.cylinder ? Number(l.asset.cylinder) : undefined,
        grade_engine: l.asset.grade_engine || undefined,
        grade_interior: l.asset.grade_interior || undefined,
        grade_exterior: l.asset.grade_exterior || undefined,
        bpkb_status: l.asset.bpkb_number ? "Ready" : undefined,
        stnk_status: "Ready", // Fallback assuming usually ready if not specified
        frame_number: l.asset.frame_number || undefined,
        photo_front: l.asset.photo_front || undefined,
        photo_back: l.asset.photo_back || undefined,
        photo_right: l.asset.photo_right || undefined,
        photo_left: l.asset.photo_left || undefined,
        photo_engine: l.asset.photo_engine || undefined,
        photo_interior: l.asset.photo_interior || undefined,
        photo_stnk: l.asset.photo_stnk || undefined,
        created_by_admin: l.asset.created_by_admin,
        created_at: l.asset.created_at.toISOString(),
        updated_at: l.asset.updated_at.toISOString(),
      },
      session: l.session ? {
        id: l.session.id,
        branch_id: l.session.branch_id,
        title: l.session.title,
        scheduled_at: l.session.scheduled_at.toISOString(),
        status: l.session.status,
        branch: l.session.branch ? {
          id: l.session.branch.id,
          tenant_id: l.session.branch.tenant_id,
          name: l.session.branch.name,
          city: l.session.branch.city,
          address: l.session.branch.address,
          phone: l.session.branch.phone,
          pic_name: l.session.branch.pic_name,
          is_active: l.session.branch.is_active,
          created_at: l.session.branch.created_at.toISOString(),
          updated_at: l.session.branch.updated_at.toISOString(),
        } : undefined,
        created_at: l.session.created_at.toISOString(),
        updated_at: l.session.updated_at.toISOString(),
      } : undefined,
      created_at: l.created_at.toISOString(),
      updated_at: l.updated_at.toISOString(),
    };
  }

  /**
   * Compute the next auto lot number for a session: the smallest positive
   * integer not already used (by manual or previous auto entries), so manual
   * numbers are simply skipped rather than shifting the auto sequence.
   */
  private async getNextAutoLotNumber(sessionId: string): Promise<number> {
    const existing = await prisma.lots.findMany({
      where: { session_id: sessionId },
      select: { lot_number: true },
      orderBy: { lot_number: 'asc' },
    });
    const used = new Set(existing.map((l) => l.lot_number));
    let candidate = 1;
    while (used.has(candidate)) candidate++;
    return candidate;
  }

  /**
   * Create a new lot (Assigns asset to a session, sets status to pending).
   * If `lot_number` is omitted, the next available number is auto-assigned.
   */
  async createLot(data: any): Promise<LotDTO> {
    // 1. Verify session exists
    const session = await prisma.auction_sessions.findUnique({ where: { id: data.session_id } });
    if (!session) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Sesi lelang tidak ditemukan');
    }
    if (session.status === SessionStatus.LIVE) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Tidak dapat menambahkan lot ke sesi yang sedang live');
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

    let lotNumber = data.lot_number;
    if (lotNumber) {
      const clash = await prisma.lots.findFirst({
        where: { session_id: data.session_id, lot_number: lotNumber },
      });
      if (clash) {
        throw new AppError(409, ErrorCode.VALIDATION_ERROR, `Nomor lot ${lotNumber} sudah digunakan pada sesi ini`);
      }
    } else {
      lotNumber = await this.getNextAutoLotNumber(data.session_id);
    }

    // 3. Perform database operations in transaction
    const [lot] = await prisma.$transaction([
      prisma.lots.create({
        data: {
          session_id: data.session_id,
          asset_id: data.asset_id,
          lot_number: lotNumber,
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
        photo_front: lot.asset.photo_front || undefined,
        photo_back: lot.asset.photo_back || undefined,
        photo_right: lot.asset.photo_right || undefined,
        photo_left: lot.asset.photo_left || undefined,
        photo_engine: lot.asset.photo_engine || undefined,
        photo_interior: lot.asset.photo_interior || undefined,
        photo_stnk: lot.asset.photo_stnk || undefined,
        created_by_admin: lot.asset.created_by_admin,
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

    if (data.session_id && data.session_id !== lot.session_id) {
      const session = await prisma.auction_sessions.findUnique({ where: { id: data.session_id } });
      if (session && session.status === SessionStatus.LIVE) {
        throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Tidak dapat memindahkan lot ke sesi yang sedang live');
      }
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
        photo_front: updated.asset.photo_front || undefined,
        photo_back: updated.asset.photo_back || undefined,
        photo_right: updated.asset.photo_right || undefined,
        photo_left: updated.asset.photo_left || undefined,
        photo_engine: updated.asset.photo_engine || undefined,
        photo_interior: updated.asset.photo_interior || undefined,
        photo_stnk: updated.asset.photo_stnk || undefined,
        created_by_admin: updated.asset.created_by_admin,
        created_at: updated.asset.created_at.toISOString(),
        updated_at: updated.asset.updated_at.toISOString(),
      },
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  /**
   * Remove a lot from its session, reverting the asset back to "approved"
   * so it reappears in the Aset Siap Dilelang list.
   */
  async deleteLot(id: string): Promise<void> {
    const lot = await prisma.lots.findUnique({ 
      where: { id },
      include: { session: true } 
    });
    if (!lot) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Lot lelang tidak ditemukan');
    }
    if (lot.session.status === SessionStatus.LIVE) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Tidak dapat menghapus lot karena sesi sedang live');
    }
    if (lot.status === LotStatus.SOLD) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Lot yang sudah terjual tidak dapat dihapus');
    }

    await prisma.$transaction([
      prisma.lots.delete({ where: { id } }),
      prisma.assets.update({ where: { id: lot.asset_id }, data: { status: AssetStatus.APPROVED } }),
    ]);
  }

  /**
   * Admin explicitly marks lot as paid (manual bypass)
   */
  async markAsPaid(id: string): Promise<string> {
    const lot = await prisma.lots.findUnique({ where: { id } });
    if (!lot) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Lot lelang tidak ditemukan');
    }
    if (lot.status !== LotStatus.SOLD) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Lot belum terjual');
    }

    const invoice = await prisma.invoices.findFirst({
      where: { lot_id: id },
      include: {
        lot: {
          include: {
            asset: {
              include: {
                provider: { select: { full_name: true, company_name: true } },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Tagihan (invoice) belum terbentuk untuk lot ini');
    }

    const wasAlreadyPaid = invoice.status === 'paid';

    if (!wasAlreadyPaid) {
      await prisma.invoices.update({
        where: { id: invoice.id },
        data: {
          status: 'paid',
          paid_at: new Date(),
        }
      });
      if (invoice.order_id) {
        await prisma.checkout_orders.update({
          where: { id: invoice.order_id },
          data: { status: 'paid' }
        });
      }

      await prisma.notifications.create({
        data: {
          user_id: invoice.bidder_id,
          type: 'invoice_paid',
          title: 'Pelunasan Diterima',
          body: `Pelunasan Anda untuk unit "${invoice.lot.asset.title}" telah diverifikasi. Dokumen BAPL, Surat Jalan, dan BAST kini dapat diunduh.`,
        },
      });
    }

    // Provider settlement (pencairan) — created here for the manual payment
    // flow; idempotent, so re-calling this endpoint is always safe.
    const settlement = await paymentsService.createSettlementForInvoice(invoice.id);

    if (!wasAlreadyPaid) {
      const providerName = invoice.lot.asset.provider.company_name || invoice.lot.asset.provider.full_name;
      const formattedNet = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(settlement.net_amount));
      await notifyAdmins(
        'lot_sold_settlement',
        'Barang Terjual — Pencairan ke Provider',
        `Unit "${invoice.lot.asset.title}" terjual dan lunas dibayar. Total yang harus ditransfer ke ${providerName}: ${formattedNet}.`,
        '/finance/settlements'
      );
    }

    return invoice.id;
  }
}

export const lotsService = new LotsService();
