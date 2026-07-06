import { z } from 'zod';

export const createMessageBody = z.object({
  nama: z.string().min(1, 'Nama wajib diisi').max(255),
  email: z.string().email('Email tidak valid').max(255),
  subjek: z.string().min(1, 'Subjek wajib diisi').max(255),
  pesan: z.string().min(1, 'Pesan wajib diisi'),
});

export const listMessagesQuery = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  is_read: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  search: z.string().optional(),
});
