import { z } from 'zod';
import { Role, UserStatus } from '@indo-lelang/shared-types';

export const updateUserSchema = z.object({
  body: z.object({
    full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter').optional(),
    phone: z.string().optional(),
    role: z.string().optional(),
    company_name: z.string().optional(),
    npwp: z.string().optional(),
    address: z.string().optional(),
    occupation: z.string().optional(),
    bank_name: z.string().optional(),
    bank_account_no: z.string().optional(),
    bank_account_name: z.string().optional(),
    npwp_url: z.string().optional(),
    pks_number: z.string().optional(),
    provider_type: z.enum(['Perusahaan Swasta', 'BUMN', 'Perorangan']).optional(),
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
    provider_status: z.enum(['pending', 'approved', 'rejected']).optional(),
    search: z.string().optional(),
  }),
});

export const adminUpdateProviderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['approved', 'rejected'], {
      errorMap: () => ({ message: 'Status provider harus approved atau rejected' }),
    }).optional(),
    provider_fee_type: z.enum(['flat', 'percentage']).optional(),
    provider_fee_amount: z.number().min(0).optional(),
    pmk41_paid_by_provider: z.boolean().optional(),
    rejection_reason: z.string().optional(),
  }),
});

export const adminCreateUserSchema = z.object({
  body: z.object({
    full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
    email: z.string().email('Email tidak valid'),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
    phone: z.string().min(9, 'Nomor telepon minimal 9 karakter').optional(),
    role: z.nativeEnum(Role).optional(),
    company_name: z.string().optional(),
    npwp: z.string().optional(),
    provider_status: z.enum(['pending', 'approved', 'rejected']).optional(),
    provider_fee_type: z.enum(['percentage', 'flat']).optional(),
    provider_fee_amount: z.string().optional().or(z.number().optional()),
    pmk41_paid_by_provider: z.boolean().optional(),
  }),
});

export const adminUpdateUserInfoSchema = z.object({
  body: z.object({
    full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter').optional(),
    email: z.string().email('Email tidak valid').optional(),
    phone: z.string().min(9, 'Nomor telepon minimal 9 karakter').optional().or(z.literal('')),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    company_name: z.string().optional(),
    npwp: z.string().optional(),
    provider_status: z.enum(['pending', 'approved', 'rejected']).optional(),
    provider_fee_type: z.enum(['percentage', 'flat']).optional(),
    provider_fee_amount: z.string().optional().or(z.number().optional()),
    pmk41_paid_by_provider: z.boolean().optional(),
  }),
});
