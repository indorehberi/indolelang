import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { AuctionSessionDTO, PaginationMeta, SessionStatus } from '@indo-lelang/shared-types';
import { Prisma } from '@prisma/client';

export class SessionsService {
  /**
   * Get list of auction sessions (paginated, filtered, searched)
   */
  async getSessions(
    page: number,
    perPage: number,
    status?: string,
    branchId?: string,
    search?: string
  ): Promise<{ sessions: AuctionSessionDTO[]; meta: PaginationMeta }> {
    const where: Prisma.auction_sessionsWhereInput = {};

    if (status) {
      where.status = status;
    }
    if (branchId) {
      where.branch_id = branchId;
    }
    if (search) {
      where.title = { contains: search };
    }

    const skip = (page - 1) * perPage;

    const [total, records] = await Promise.all([
      prisma.auction_sessions.count({ where }),
      prisma.auction_sessions.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { scheduled_at: 'asc' },
        include: { branch: true },
      }),
    ]);

    const sessions: AuctionSessionDTO[] = records.map((s) => ({
      id: s.id,
      branch_id: s.branch_id,
      title: s.title,
      description: s.description || undefined,
      scheduled_at: s.scheduled_at.toISOString(),
      status: s.status,
      operator_id: s.operator_id || undefined,
      branch: {
        id: s.branch.id,
        tenant_id: s.branch.tenant_id,
        name: s.branch.name,
        city: s.branch.city,
        address: s.branch.address,
        phone: s.branch.phone,
        pic_name: s.branch.pic_name,
        is_active: s.branch.is_active,
        created_at: s.branch.created_at.toISOString(),
        updated_at: s.branch.updated_at.toISOString(),
      },
      created_at: s.created_at.toISOString(),
      updated_at: s.updated_at.toISOString(),
    }));

    const totalPages = Math.ceil(total / perPage);

    return {
      sessions,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Get auction session details
   */
  async getSessionById(id: string): Promise<AuctionSessionDTO> {
    const s = await prisma.auction_sessions.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!s) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Sesi lelang tidak ditemukan');
    }

    return {
      id: s.id,
      branch_id: s.branch_id,
      title: s.title,
      description: s.description || undefined,
      scheduled_at: s.scheduled_at.toISOString(),
      status: s.status,
      operator_id: s.operator_id || undefined,
      branch: {
        id: s.branch.id,
        tenant_id: s.branch.tenant_id,
        name: s.branch.name,
        city: s.branch.city,
        address: s.branch.address,
        phone: s.branch.phone,
        pic_name: s.branch.pic_name,
        is_active: s.branch.is_active,
        created_at: s.branch.created_at.toISOString(),
        updated_at: s.branch.updated_at.toISOString(),
      },
      created_at: s.created_at.toISOString(),
      updated_at: s.updated_at.toISOString(),
    };
  }

  /**
   * Create a new auction session (Admin/Operator only)
   */
  async createSession(data: any, operatorId: string): Promise<AuctionSessionDTO> {
    let finalBranchId = data.branch_id;
    let branch = null;

    if (finalBranchId) {
      branch = await prisma.branches.findUnique({ where: { id: finalBranchId } });
    }

    // Fallback: If no branch_id provided or branch not found, use or create default Jakarta branch
    if (!branch) {
      branch = await prisma.branches.findFirst({
        where: { name: { contains: 'Jakarta' } }
      });

      if (!branch) {
        branch = await prisma.branches.create({
          data: {
            tenant_id: 'default',
            name: 'Indo-Lelang Jakarta (Pusat)',
            city: 'Jakarta',
            address: 'Jl. Sudirman, Jakarta',
            phone: '+622155551234',
            pic_name: 'Admin Pusat',
            is_active: true,
          }
        });
      }
      finalBranchId = branch.id;
    }

    const s = await prisma.auction_sessions.create({
      data: {
        branch_id: finalBranchId,
        title: data.title,
        description: data.description || null,
        scheduled_at: new Date(data.scheduled_at),
        status: SessionStatus.DRAFT,
        operator_id: operatorId,
      },
      include: { branch: true },
    });

    return {
      id: s.id,
      branch_id: s.branch_id,
      title: s.title,
      description: s.description || undefined,
      scheduled_at: s.scheduled_at.toISOString(),
      status: s.status,
      operator_id: s.operator_id || undefined,
      branch: {
        id: s.branch.id,
        tenant_id: s.branch.tenant_id,
        name: s.branch.name,
        city: s.branch.city,
        address: s.branch.address,
        phone: s.branch.phone,
        pic_name: s.branch.pic_name,
        is_active: s.branch.is_active,
        created_at: s.branch.created_at.toISOString(),
        updated_at: s.branch.updated_at.toISOString(),
      },
      created_at: s.created_at.toISOString(),
      updated_at: s.updated_at.toISOString(),
    };
  }

  /**
   * Update auction session (Admin/Operator only)
   */
  async updateSession(id: string, data: any, operatorId: string): Promise<AuctionSessionDTO> {
    const session = await prisma.auction_sessions.findUnique({
      where: { id },
    });

    if (!session) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Sesi lelang tidak ditemukan');
    }

    if (data.branch_id) {
      const branch = await prisma.branches.findUnique({ where: { id: data.branch_id } });
      if (!branch) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'Cabang tidak ditemukan');
      }
    }

    const updated = await prisma.auction_sessions.update({
      where: { id },
      data: {
        branch_id: data.branch_id ?? undefined,
        title: data.title ?? undefined,
        description: data.description !== undefined ? data.description : undefined,
        scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
        status: data.status ?? undefined,
        operator_id: operatorId,
      },
      include: { branch: true },
    });

    return {
      id: updated.id,
      branch_id: updated.branch_id,
      title: updated.title,
      description: updated.description || undefined,
      scheduled_at: updated.scheduled_at.toISOString(),
      status: updated.status,
      operator_id: updated.operator_id || undefined,
      branch: {
        id: updated.branch.id,
        tenant_id: updated.branch.tenant_id,
        name: updated.branch.name,
        city: updated.branch.city,
        address: updated.branch.address,
        phone: updated.branch.phone,
        pic_name: updated.branch.pic_name,
        is_active: updated.branch.is_active,
        created_at: updated.branch.created_at.toISOString(),
        updated_at: updated.branch.updated_at.toISOString(),
      },
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  /**
   * Delete auction session (Admin/Operator only)
   */
  async deleteSession(id: string): Promise<void> {
    const session = await prisma.auction_sessions.findUnique({
      where: { id },
      include: { _count: { select: { lots: true } } },
    });

    if (!session) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Sesi lelang tidak ditemukan');
    }

    if (session._count.lots > 0) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Sesi lelang tidak bisa dihapus karena memiliki lot/barang');
    }

    await prisma.auction_sessions.delete({
      where: { id },
    });
  }

  /**
   * Get session reports (Admin/Operator only)
   * Fetches sessions and aggregates lot statistics (total lots, sold lots, total value)
   */
  async getSessionReports(page: number = 1, perPage: number = 20, search?: string) {
    const where: any = {};
    
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const skip = (page - 1) * perPage;

    const [total, records] = await Promise.all([
      prisma.auction_sessions.count({ where }),
      prisma.auction_sessions.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { scheduled_at: 'desc' },
        include: {
          lots: {
            select: {
              status: true,
              hammer_price: true,
            }
          }
        }
      }),
    ]);

    const reports = records.map(session => {
      const total_lots = session.lots.length;
      const sold_lots = session.lots.filter(l => l.status === 'sold' || l.status === 'paid' || l.status === 'settled').length;
      
      const total_value = session.lots
        .filter(l => l.status === 'sold' || l.status === 'paid' || l.status === 'settled')
        .reduce((sum, l) => sum + Number(l.hammer_price || 0), 0);
        
      const sell_rate = total_lots > 0 ? Math.round((sold_lots / total_lots) * 100) : 0;

      return {
        id: session.id,
        name: session.title,
        date: session.scheduled_at.toISOString(),
        total_lots,
        sold_lots,
        total_value,
        sell_rate,
        status: session.status
      };
    });

    return {
      reports,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }
}
