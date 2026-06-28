import { z } from 'zod';

export const updateSettingSchema = z.object({
  body: z.object({
    value: z.string().min(1, 'Nilai setting tidak boleh kosong'),
  }),
});

export const getSettingsQuerySchema = z.object({
  query: z.object({
    tenant_id: z.string().optional().default('default'),
  }),
});
