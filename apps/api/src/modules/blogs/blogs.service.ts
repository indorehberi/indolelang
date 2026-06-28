import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { logger } from '../../lib/logger';
import { ErrorCode } from '@indo-lelang/utils';

interface ListBlogsQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: 'draft' | 'published';
}

export class BlogsService {
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Ganti spasi dengan -
      .replace(/[^\w\-]+/g, '')       // Hapus karakter non-word
      .replace(/\-\-+/g, '-');        // Ganti ganda - dengan single -
  }

  /**
   * List published blogs for public view
   */
  async listPublishedBlogs(query: ListBlogsQuery) {
    const page = query.page || 1;
    const perPage = query.per_page || 10;
    const skip = (page - 1) * perPage;

    const where: any = {
      status: 'published',
      deleted_at: null,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [blogs, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { published_at: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.blog_posts.count({ where }),
    ]);

    return {
      data: blogs,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get single published blog by slug
   */
  async getBlogBySlug(slug: string) {
    const blog = await prisma.blog_posts.findFirst({
      where: {
        slug,
        status: 'published',
        deleted_at: null,
      },
      include: {
        author: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!blog) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Artikel blog tidak ditemukan');
    }

    return blog;
  }

  /**
   * List all blogs (draft & published) for admin/operator
   */
  async listAllBlogsAdmin(query: ListBlogsQuery) {
    const page = query.page || 1;
    const perPage = query.per_page || 10;
    const skip = (page - 1) * perPage;

    const where: any = {
      deleted_at: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [blogs, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.blog_posts.count({ where }),
    ]);

    return {
      data: blogs,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get any blog post by ID (Admin only)
   */
  async getBlogByIdAdmin(id: string) {
    const blog = await prisma.blog_posts.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: {
        author: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!blog) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Artikel blog tidak ditemukan');
    }

    return blog;
  }

  /**
   * Create a new blog post (Admin/Operator only)
   */
  async createBlogPost(authorId: string, data: { title: string; content: string; image_url?: string | null; status?: 'draft' | 'published' }) {
    const rawSlug = this.slugify(data.title);
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const slug = `${rawSlug}-${uniqueSuffix}`;
    const status = data.status || 'draft';
    const publishedAt = status === 'published' ? new Date() : null;

    const blog = await prisma.blog_posts.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        image_url: data.image_url,
        status,
        published_at: publishedAt,
        author_id: authorId,
      },
    });

    logger.info({ blogId: blog.id, authorId }, 'Blog post created successfully');
    return blog;
  }

  /**
   * Update an existing blog post (Admin/Operator only)
   */
  async updateBlogPost(id: string, data: { title?: string; content?: string; image_url?: string | null; status?: 'draft' | 'published' }) {
    const blog = await prisma.blog_posts.findFirst({
      where: { id, deleted_at: null },
    });

    if (!blog) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Artikel blog tidak ditemukan');
    }

    const updateData: any = {
      content: data.content,
      image_url: data.image_url,
    };

    if (data.title && data.title !== blog.title) {
      updateData.title = data.title;
      const rawSlug = this.slugify(data.title);
      const uniqueSuffix = Math.random().toString(36).substring(2, 7);
      updateData.slug = `${rawSlug}-${uniqueSuffix}`;
    }

    if (data.status && data.status !== blog.status) {
      updateData.status = data.status;
      if (data.status === 'published' && !blog.published_at) {
        updateData.published_at = new Date();
      }
    }

    const updatedBlog = await prisma.blog_posts.update({
      where: { id },
      data: updateData,
    });

    logger.info({ blogId: id }, 'Blog post updated successfully');
    return updatedBlog;
  }

  /**
   * Soft delete a blog post (Admin/Operator only)
   */
  async softDeleteBlogPost(id: string) {
    const blog = await prisma.blog_posts.findFirst({
      where: { id, deleted_at: null },
    });

    if (!blog) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Artikel blog tidak ditemukan');
    }

    await prisma.blog_posts.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    logger.info({ blogId: id }, 'Blog post soft deleted successfully');
    return true;
  }
}

export const blogsService = new BlogsService();
