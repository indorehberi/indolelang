import { z } from 'zod';
import { Role, UserStatus } from '@indo-lelang/shared-types';

export const updateUserSchema = z.object({
  body: z.object({
    full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter').optional(),
    phone: z.string().optional(),
    company_name: z.string().optional(),
    npwp: z.string().optional(),
  }),
});

export const adminUpdateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum([UserStatus.PENDING, UserStatus.ACTIVE, UserStatus.SUSPENDED], {
      errorMap: () => ({ message: 'Status tidak valid' }),
    }),
  }),
});

export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val, 10)).default('1'),
    per_page: z.string().transform(val => parseInt(val, 10)).default('20'),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    search: z.string().optional(),
  }),
});
