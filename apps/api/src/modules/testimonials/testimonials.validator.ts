import { z } from 'zod';

export const createTestimonialBody = z.object({
  rating: z.number().int('Rating harus berupa bilangan bulat').min(1, 'Rating minimal 1 bintang').max(5, 'Rating maksimal 5 bintang'),
  content: z.string().min(10, 'Testimoni minimal 10 karakter').max(500, 'Testimoni maksimal 500 karakter'),
});

export const adminCreateTestimonialBody = z.object({
  user_id: z.string().uuid().optional().nullable(),
  display_name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').optional().nullable(),
  rating: z.number().int('Rating harus berupa bilangan bulat').min(1, 'Rating minimal 1 bintang').max(5, 'Rating maksimal 5 bintang'),
  content: z.string().min(10, 'Testimoni minimal 10 karakter').max(500, 'Testimoni maksimal 500 karakter'),
  image_url: z.string().optional().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const adminUpdateTestimonialBody = z.object({
  display_name: z.string().min(2).max(100).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional(),
  content: z.string().min(10).max(500).optional(),
  image_url: z.string().optional().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const moderateTestimonialBody = z.object({
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Status moderasi harus berupa approved atau rejected' }),
  }),
});

export const listTestimonialsQuery = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  per_page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});
