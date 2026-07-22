import { z } from 'zod';

export const createCampaignSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul minimal 3 karakter').max(100, 'Judul maksimal 100 karakter'),
    message: z.string().min(10, 'Isi pesan minimal 10 karakter'),
    target_role: z.enum(['bidder', 'provider', 'all']),
    send_email: z.boolean().optional(),
    send_wa: z.boolean().optional(),
  }),
});

export const listCampaignsQuery = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  per_page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});
