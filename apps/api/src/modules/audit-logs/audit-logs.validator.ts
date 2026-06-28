import { z } from 'zod';

export const listAuditLogsQuery = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).optional(),
  per_page: z.string().transform((val) => parseInt(val, 10)).optional(),
  user_id: z.string().uuid().optional(),
  action: z.string().optional(),
  resource_type: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
});

export const auditLogParams = z.object({
  id: z.string().uuid('ID audit log tidak valid'),
});

export const entityAuditLogsParams = z.object({
  resource_type: z.string().min(1, 'Tipe resource wajib diisi'),
  resource_id: z.string().min(1, 'ID resource wajib diisi'),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuery>;
export type AuditLogParams = z.infer<typeof auditLogParams>;
export type EntityAuditLogsParams = z.infer<typeof entityAuditLogsParams>;
