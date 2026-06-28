import { z } from 'zod';

export const listNotificationsQuery = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).optional(),
  per_page: z.string().transform((val) => parseInt(val, 10)).optional(),
  is_read: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
});

export const markReadParams = z.object({
  id: z.string().uuid('ID notifikasi tidak valid'),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuery>;
export type MarkReadParams = z.infer<typeof markReadParams>;
