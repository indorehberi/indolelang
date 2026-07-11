import { prisma } from '../../config/database';
import { AssetCategory } from '@indo-lelang/shared-types';

export class PublicService {
  /**
   * Get all active and upcoming public auction sessions
   */
  async getPublicSessions() {
    return prisma.auction_sessions.findMany({
      where: {
        status: {
          in: ['published', 'PUBLISHED', 'live', 'LIVE', 'pending', 'PENDING'],
        },
      },
      include: {
        branch: true,
        _count: {
          select: { lots: true },
        },
      },
      orderBy: {
        scheduled_at: 'asc',
      },
    });
  }

  /**
   * Get public details of a specific auction session with its lots
   */
  async getPublicSessionDetail(id: string) {
    return prisma.auction_sessions.findUnique({
      where: { id },
      include: {
        branch: true,
        lots: {
          include: {
            asset: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                base_price: true,
                images: true,
                status: true,
              },
            },
          },
          orderBy: {
            lot_number: 'asc',
          },
        },
      },
    });
  }

  /**
   * Get featured lots (only Mobil category for initial target)
   */
  async getFeaturedLots() {
    return prisma.lots.findMany({
      where: {
        status: {
          in: ['pending', 'PENDING', 'active', 'ACTIVE'],
        },
        session: {
          status: {
            in: ['published', 'PUBLISHED', 'live', 'LIVE', 'pending', 'PENDING'],
          },
        },
      },
      include: {
        asset: true,
        session: {
          include: {
            branch: true,
          },
        },
      },
      take: 100,
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Get statistics of active/upcoming lots per category
   */
  async getCategoryStats() {
    // We want to return count for all standard categories
    const categories = ['MOBIL', 'MOTOR', 'PROPERTI', 'ELEKTRONIK'];
    const stats: Record<string, number> = {};

    for (const category of categories) {
      const count = await prisma.lots.count({
        where: {
          status: {
            in: ['pending', 'active'],
          },
          asset: {
            category,
          },
          session: {
            status: {
              in: ['published', 'live'],
            },
          },
        },
      });
      stats[category] = count;
    }

    return stats;
  }

  /**
   * Get general platform statistics
   */
  async getPlatformStats() {
    const totalUsers = await prisma.users.count({
      where: {
        status: 'active',
      },
    });

    const totalLotsSold = await prisma.lots.count({
      where: {
        status: 'sold',
      },
    });

    const activeSessions = await prisma.auction_sessions.count({
      where: {
        status: 'live',
      },
    });

    // Sum of hammer prices of sold lots
    const sumResult = await prisma.lots.aggregate({
      where: {
        status: 'sold',
      },
      _sum: {
        hammer_price: true,
      },
    });

    return {
      total_users: totalUsers,
      total_lots_sold: totalLotsSold,
      active_sessions: activeSessions,
      total_sales: sumResult._sum.hammer_price ? Number(sumResult._sum.hammer_price) : 0,
    };
  }

  /**
   * Get public platform settings (feature toggles)
   */
  async getPublicSettings() {
    const settings = await prisma.platform_settings.findMany({
      where: {
        key: {
          startsWith: 'feat_',
        },
      },
      select: {
        key: true,
        value: true,
      },
    });
    
    // Convert to a key-value object
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  }
}
