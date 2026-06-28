import { Request, Response, NextFunction } from 'express';
import { blogsService } from './blogs.service';
import { sendSuccess } from '../../lib/apiResponse';

export class BlogsController {
  /**
   * GET /blogs — List published blogs (Public)
   */
  async listPublished(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blogsService.listPublishedBlogs(req.query);
      return sendSuccess(res, result.data, 'Daftar blog berhasil dimuat', result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /blogs/:slug — Get single published blog by slug (Public)
   */
  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const blog = await blogsService.getBlogBySlug(slug);
      return sendSuccess(res, blog, 'Artikel blog berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/blogs — List all blogs (Admin/Operator only)
   */
  async listAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blogsService.listAllBlogsAdmin(req.query);
      return sendSuccess(res, result.data, 'Daftar blog administratif berhasil dimuat', result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/blogs/:id — Get blog by ID (Admin/Operator only)
   */
  async getByIdAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const blog = await blogsService.getBlogByIdAdmin(id);
      return sendSuccess(res, blog, 'Detail blog administratif berhasil dimuat');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/blogs — Create new blog draft (Admin/Operator only)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authorId = req.user!.id;
      const blog = await blogsService.createBlogPost(authorId, req.body);
      return sendSuccess(res, blog, 'Artikel blog baru berhasil dibuat', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/blogs/:id — Update blog post (Admin/Operator only)
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const blog = await blogsService.updateBlogPost(id, req.body);
      return sendSuccess(res, blog, 'Artikel blog berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /admin/blogs/:id — Soft delete blog post (Admin/Operator only)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await blogsService.softDeleteBlogPost(id);
      return sendSuccess(res, null, 'Artikel blog berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }
}

export const blogsController = new BlogsController();
