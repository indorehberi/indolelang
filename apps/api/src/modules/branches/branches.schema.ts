import { z } from 'zod';
import { isValidIndonesianPhoneNumber } from '@indo-lelang/utils';

export const createBranchSchema = z.object({
  body: z.object({
    tenant_id: z.string().default('default'),
    name: z.string().min(3, 'Nama cabang minimal 3 karakter'),
    city: z.string().min(2, 'Nama kota minimal 2 karakter'),
    address: z.string().min(5, 'Alamat minimal 5 karakter'),
    phone: z.string().refine(isValidIndonesianPhoneNumber, {
      message: 'Format nomor telepon cabang tidak valid',
    }),
    pic_name: z.string().min(3, 'Nama PIC minimal 3 karakter'),
    is_active: z.boolean().default(true),
  }),
});

export const updateBranchSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama cabang minimal 3 karakter').optional(),
    city: z.string().min(2, 'Nama kota minimal 2 karakter').optional(),
    address: z.string().min(5, 'Alamat minimal 5 karakter').optional(),
    phone: z
      .string()
      .refine(isValidIndonesianPhoneNumber, {
        message: 'Format nomor telepon cabang tidak valid',
      })
      .optional(),
    pic_name: z.string().min(3, 'Nama PIC minimal 3 karakter').optional(),
    is_active: z.boolean().optional(),
  }),
});
