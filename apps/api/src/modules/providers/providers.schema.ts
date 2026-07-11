import { z } from 'zod';

export const applyProviderSchema = z.object({
  body: z.object({
    company_name: z.string().min(1, 'Nama perusahaan wajib diisi'),
    npwp: z.string().min(1, 'NPWP wajib diisi'),
    npwp_url: z.string().min(1, 'Upload NPWP wajib diisi'),
    pks_number: z.string().optional(),
    provider_type: z.enum(['Perusahaan Swasta', 'BUMN', 'Perorangan']),
    address: z.string().min(1, 'Alamat wajib diisi'),
    bank_name: z.string().optional(),
    bank_account_no: z.string().optional(),
    bank_account_name: z.string().optional(),
    ktp_url: z.string().optional(),
    selfie_url: z.string().optional(),
  }),
});

export const getProvidersQuerySchema = z.object({
  query: z.object({
    page: z.string().transform((val) => parseInt(val, 10)).default('1'),
    per_page: z.string().transform((val) => parseInt(val, 10)).default('20'),
    status: z.enum(['antri', 'aktif', 'ditolak', 'nonaktif']).optional(),
    search: z.string().optional(),
  }),
});

export const rejectProviderSchema = z.object({
  body: z.object({
    reason: z.string().min(3, 'Alasan penolakan wajib diisi'),
  }),
});

export const approveProviderSchema = z.object({
  body: z.object({
    provider_fee_type: z.enum(['flat', 'percentage']).optional(),
    provider_fee_amount: z.number().min(0).optional(),
    pmk41_paid_by_provider: z.boolean().optional(),
  }),
});
