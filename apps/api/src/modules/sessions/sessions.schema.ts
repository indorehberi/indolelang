import { z } from 'zod';
import { SessionStatus } from '@indo-lelang/shared-types';

export const createSessionSchema = z.object({
  body: z.object({
    branch_id: z.string().uuid('ID Cabang tidak valid').optional(),
    title: z.string().min(5, 'Judul sesi minimal 5 karakter'),
    description: z.string().optional(),
    scheduled_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Format tanggal jadwal tidak valid (ISO Datetime)',
    }),
  }),
});

export const updateSessionSchema = z.object({
  body: z.object({
    branch_id: z.string().uuid('ID Cabang tidak valid').optional(),
    title: z.string().min(5, 'Judul sesi minimal 5 karakter').optional(),
    description: z.string().optional(),
    scheduled_at: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Format tanggal jadwal tidak valid',
      })
      .optional(),
    status: z
      .enum([
        SessionStatus.DRAFT,
        SessionStatus.PUBLISHED,
        SessionStatus.LIVE,
        SessionStatus.CLOSED,
      ], {
        errorMap: () => ({ message: 'Status sesi tidak valid' }),
      })
      .optional(),
  }),
});

export const getSessionsQuerySchema = z.object({
  query: z.object({
    page: z.string().transform((val) => parseInt(val, 10)).default('1'),
    per_page: z.string().transform((val) => parseInt(val, 10)).default('20'),
    status: z.enum([
      SessionStatus.DRAFT,
      SessionStatus.PUBLISHED,
      SessionStatus.LIVE,
      SessionStatus.CLOSED,
    ]).optional(),
    branch_id: z.string().uuid('ID Cabang tidak valid').optional(),
    search: z.string().optional(),
  }),
});
