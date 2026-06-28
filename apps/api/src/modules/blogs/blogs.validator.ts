import { z } from 'zod';

export const createBlogBody = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter').max(100, 'Judul maksimal 100 karakter'),
  content: z.string().min(10, 'Konten blog minimal 10 karakter'),
  image_url: z.string().url('Format URL gambar tidak valid').optional().nullable(),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const updateBlogBody = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter').max(100, 'Judul maksimal 100 karakter').optional(),
  content: z.string().min(10, 'Konten blog minimal 10 karakter').optional(),
  image_url: z.string().url('Format URL gambar tidak valid').optional().nullable(),
  status: z.enum(['draft', 'published']).optional(),
});

export const listBlogsQuery = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  per_page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
});
