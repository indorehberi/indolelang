import { z } from 'zod';
import { SessionStatus } from '@indo-lelang/shared-types';

// branches.id is a plain string PK — the production seed upserts the default
// branch with a hardcoded human-readable id ("default-jakarta-branch-id-production")
// that is NOT a uuid. Validate branch_id as optional string (normalizing ""/null
// to undefined), not as uuid, so both legacy and new uuid branch IDs are accepted.
const optionalBranchId = () =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().optional());

export const createSessionSchema = z.object({
  body: z.object({
    branch_id: optionalBranchId(),
    title: z.string().min(5, 'Judul sesi minimal 5 karakter'),
    description: z.string().optional(),
    scheduled_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Format tanggal jadwal tidak valid (ISO Datetime)',
    }),
    is_exclusive: z.boolean().optional(),
    exclusive_provider_id: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().uuid('ID Provider tidak valid').optional()),
    registration_lead_hours: z.number().int().min(0, 'Jam batas pendaftaran tidak boleh negatif').nullable().optional(),
  }),
});

export const updateSessionSchema = z.object({
  body: z.object({
    branch_id: optionalBranchId(),
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
    is_exclusive: z.boolean().optional(),
    exclusive_provider_id: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().uuid('ID Provider tidak valid').optional()),
    registration_lead_hours: z.number().int().min(0, 'Jam batas pendaftaran tidak boleh negatif').nullable().optional(),
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
    branch_id: optionalBranchId(),
    search: z.string().optional(),
    is_exclusive: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
    date: z.string().optional(),
  }),
});
