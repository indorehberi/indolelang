import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { logger } from '../../lib/logger';
import { ErrorCode } from '@indo-lelang/utils';

interface ListTestimonialsQuery {
  page?: number;
  per_page?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

export class TestimonialsService {
  /**
   * List approved testimonials for public landing page
   */
  async listApprovedTestimonials(query: ListTestimonialsQuery) {
    const page = query.page || 1;
    const perPage = query.per_page || 10;
    const skip = (page - 1) * perPage;

    const where = {
      status: 'approved',
      deleted_at: null,
    };

    const [testimonials, total] = await Promise.all([
      prisma.testimonials.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.testimonials.count({ where }),
    ]);

    return {
      data: testimonials,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Create a new pending testimonial (Bidder/Provider only)
   */
  async createTestimonial(userId: string, data: { rating: number; content: string }) {
    const testimonial = await prisma.testimonials.create({
      data: {
        user_id: userId,
        rating: data.rating,
        content: data.content,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    logger.info({ testimonialId: testimonial.id, userId }, 'Testimonial created successfully');
    return testimonial;
  }

  /**
   * List all testimonials with filters for admin moderation
   */
  async listAllTestimonialsAdmin(query: ListTestimonialsQuery) {
    const page = query.page || 1;
    const perPage = query.per_page || 10;
    const skip = (page - 1) * perPage;

    const where: any = {
      deleted_at: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    const [testimonials, total] = await Promise.all([
      prisma.testimonials.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.testimonials.count({ where }),
    ]);

    return {
      data: testimonials,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Moderate testimonial (Approve or Reject) (Admin/Operator only)
   */
  async moderateTestimonial(id: string, status: 'approved' | 'rejected') {
    const testimonial = await prisma.testimonials.findFirst({
      where: { id, deleted_at: null },
    });

    if (!testimonial) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Testimoni tidak ditemukan');
    }

    const updatedTestimonial = await prisma.testimonials.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    logger.info({ testimonialId: id, status }, 'Testimonial moderated successfully');
    return updatedTestimonial;
  }

  /**
   * Soft delete a testimonial (Admin/Operator only)
   */
  async softDeleteTestimonial(id: string) {
    const testimonial = await prisma.testimonials.findFirst({
      where: { id, deleted_at: null },
    });

    if (!testimonial) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Testimoni tidak ditemukan');
    }

    await prisma.testimonials.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    logger.info({ testimonialId: id }, 'Testimonial soft deleted successfully');
    return true;
  }

  /**
   * Admin: Get single testimonial by ID
   */
  async getTestimonialByIdAdmin(id: string) {
    const testimonial = await prisma.testimonials.findFirst({
      where: { id, deleted_at: null },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    if (!testimonial) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Testimoni tidak ditemukan');
    }

    return testimonial;
  }

  /**
   * Admin: Create a new testimonial on behalf of user
   */
  async createTestimonialAdmin(data: { user_id: string; rating: number; content: string; image_url?: string | null; status?: 'pending' | 'approved' | 'rejected' }) {
    const user = await prisma.users.findUnique({ where: { id: data.user_id } });
    if (!user) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'User tidak ditemukan');
    }

    const testimonial = await prisma.testimonials.create({
      data: {
        user_id: data.user_id,
        rating: data.rating,
        content: data.content,
        image_url: data.image_url,
        status: data.status || 'approved',
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    logger.info({ testimonialId: testimonial.id, adminCreated: true }, 'Testimonial created successfully by admin');
    return testimonial;
  }

  /**
   * Admin: Update an existing testimonial
   */
  async updateTestimonialAdmin(id: string, data: { rating?: number; content?: string; image_url?: string | null; status?: 'pending' | 'approved' | 'rejected' }) {
    const testimonial = await prisma.testimonials.findFirst({
      where: { id, deleted_at: null },
    });

    if (!testimonial) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Testimoni tidak ditemukan');
    }

    const updatedTestimonial = await prisma.testimonials.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    logger.info({ testimonialId: id, adminUpdated: true }, 'Testimonial updated successfully by admin');
    return updatedTestimonial;
  }
}

export const testimonialsService = new TestimonialsService();
