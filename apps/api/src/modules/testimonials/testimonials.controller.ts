import { Request, Response, NextFunction } from 'express';
import { testimonialsService } from './testimonials.service';
import { sendSuccess } from '../../lib/apiResponse';

export class TestimonialsController {
  /**
   * GET /testimonials — List approved testimonials (Public)
   */
  async listApproved(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await testimonialsService.listApprovedTestimonials(req.query);
      return sendSuccess(res, result.data, 'Daftar testimoni berhasil dimuat', result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /testimonials — Submit a new testimonial (Authenticated User only)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const testimonial = await testimonialsService.createTestimonial(userId, req.body);
      return sendSuccess(res, testimonial, 'Testimoni berhasil diajukan dan menunggu moderasi', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/testimonials — List all testimonials for moderation (Admin/Operator only)
   */
  async listAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await testimonialsService.listAllTestimonialsAdmin(req.query);
      return sendSuccess(res, result.data, 'Daftar testimoni administratif berhasil dimuat', result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/testimonials/:id/status — Moderate testimonial status (Admin/Operator only)
   */
  async moderate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const testimonial = await testimonialsService.moderateTestimonial(id, status);
      return sendSuccess(res, testimonial, `Testimoni berhasil diubah statusnya menjadi ${status}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /admin/testimonials/:id — Soft delete testimonial (Admin/Operator only)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await testimonialsService.softDeleteTestimonial(id);
      return sendSuccess(res, null, 'Testimoni berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/testimonials/:id — Get single testimonial (Admin/Operator only)
   */
  async getByIdAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const testimonial = await testimonialsService.getTestimonialByIdAdmin(id);
      return sendSuccess(res, testimonial, 'Data testimoni berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/testimonials — Create testimonial (Admin/Operator only)
   */
  async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const testimonial = await testimonialsService.createTestimonialAdmin(req.body);
      return sendSuccess(res, testimonial, 'Testimoni berhasil ditambahkan oleh admin', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/testimonials/:id — Update testimonial (Admin/Operator only)
   */
  async updateAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const testimonial = await testimonialsService.updateTestimonialAdmin(id, req.body);
      return sendSuccess(res, testimonial, 'Testimoni berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }
}

export const testimonialsController = new TestimonialsController();
