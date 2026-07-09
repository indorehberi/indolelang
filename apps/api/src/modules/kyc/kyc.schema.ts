import { z } from 'zod';
import { KycStatus } from '@indo-lelang/shared-types';

export const uploadKycSchema = z.object({
  body: z.object({
    nik: z.string().min(16, 'NIK harus 16 digit').max(16, 'NIK harus 16 digit').optional(),
    ktp_url: z.string().url('URL KTP tidak valid').optional(),
    selfie_url: z.string().url('URL Selfie tidak valid').optional(),
    ktp_selfie_url: z.string().url('URL KTP Selfie tidak valid').optional(),
  }),
});

export const rejectKycSchema = z.object({
  body: z.object({
    rejection_reason: z.string().min(5, 'Alasan penolakan minimal 5 karakter'),
  }),
});

export const kycQueueQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
    per_page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
    status: z.enum([KycStatus.PENDING, KycStatus.APPROVED, KycStatus.REJECTED, 'all']).default(KycStatus.PENDING),
  }),
});
