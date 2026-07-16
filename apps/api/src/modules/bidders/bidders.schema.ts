import { z } from 'zod';

export const applyBidderSchema = z.object({
  body: z.object({
    address: z.string().optional(),
    occupation: z.string().optional(),
    bank_name: z.string().optional(),
    bank_account_no: z.string().optional(),
    bank_account_name: z.string().optional(),
    nik: z.string().optional(),
    ktp_url: z.string().optional(),
    selfie_url: z.string().optional(),
  }),
});

export const getBiddersQuerySchema = z.object({
  query: z.object({
    page: z.string().transform((val) => parseInt(val, 10)).default('1'),
    per_page: z.string().transform((val) => parseInt(val, 10)).default('20'),
    status: z.enum(['antri', 'aktif', 'ditolak', 'nonaktif']).optional(),
    search: z.string().optional(),
  }),
});

export const rejectBidderSchema = z.object({
  body: z.object({
    reason: z.string().min(3, 'Alasan penolakan wajib diisi'),
  }),
});

export const adjustNiplSchema = z.object({
  body: z.object({
    mobil_count: z.number().int().min(0, 'Jumlah NIPL mobil tidak boleh negatif').default(0),
    motor_count: z.number().int().min(0, 'Jumlah NIPL motor tidak boleh negatif').default(0),
  }),
});
