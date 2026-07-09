import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { ErrorCode } from '@indo-lelang/shared-types';

export class ReferralsService {
  /**
   * Get Admin Referrals List
   */
  async getAdminReferrals(page: number = 1, perPage: number = 20, search?: string) {
    const skip = (page - 1) * perPage;
    
    let whereClause: any = {};
    if (search) {
      whereClause = {
        OR: [
          { referrer: { full_name: { contains: search, mode: 'insensitive' } } },
          { referrer: { email: { contains: search, mode: 'insensitive' } } },
          { code: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [total, records] = await Promise.all([
      prisma.referrals.count({ where: whereClause }),
      prisma.referrals.findMany({
        where: whereClause,
        include: {
          referrer: { select: { full_name: true, email: true } },
          _count: { select: { usages: true } }
        },
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const mapped = records.map(r => ({
      id: r.id,
      name: r.referrer?.full_name || '-',
      email: r.referrer?.email || '-',
      referral_code: r.code,
      referrals_count: r._count.usages,
      total_reward: Number(r.total_reward),
      status: r.status,
      joined_at: r.created_at.toISOString(),
    }));

    return {
      data: mapped,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get My Referral (Bidder)
   */
  async getMyReferral(userId: string) {
    const referral = await prisma.referrals.findUnique({
      where: { referrer_id: userId },
      include: {
        _count: { select: { usages: true } },
        usages: {
          include: {
            referred: { select: { full_name: true, created_at: true } }
          },
          orderBy: { created_at: 'desc' },
          take: 10,
        }
      }
    });

    if (!referral) {
      return null;
    }

    return {
      id: referral.id,
      code: referral.code,
      total_reward: Number(referral.total_reward),
      status: referral.status,
      usages_count: referral._count.usages,
      recent_usages: referral.usages.map(u => ({
        id: u.id,
        referred_name: u.referred?.full_name || '-',
        reward_amount: Number(u.reward_amount),
        status: u.status,
        date: u.created_at.toISOString(),
      }))
    };
  }

  /**
   * Generate Referral Code for Bidder
   */
  async generateReferral(userId: string) {
    const existing = await prisma.referrals.findUnique({
      where: { referrer_id: userId }
    });

    if (existing) {
      return existing;
    }

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, ErrorCode.NOT_FOUND, 'User tidak ditemukan');

    // Generate code: First 3 letters of name + Random 4 digits
    const prefix = user.full_name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X').padEnd(3, 'X');
    
    let isUnique = false;
    let code = '';
    while (!isUnique) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      code = `${prefix}${rand}`;
      const conflict = await prisma.referrals.findUnique({ where: { code } });
      if (!conflict) isUnique = true;
    }

    return await prisma.referrals.create({
      data: {
        referrer_id: userId,
        code,
      }
    });
  }
}

export const referralsService = new ReferralsService();
