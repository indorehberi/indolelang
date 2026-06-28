import { z } from 'zod';
import { Role } from '@indo-lelang/shared-types';

/**
 * Register schema - for bidder and provider registration
 */
export const registerSchema = z.object({
	body: z.object({
		email: z.string().email('Email tidak valid'),
		phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Nomor telepon tidak valid'),
		password: z.string().min(8, 'Password minimal 8 karakter'),
		full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
		role: z.enum([Role.BIDDER, Role.PROVIDER], {
			errorMap: () => ({ message: 'Role harus bidder atau provider' }),
		}),
		company_name: z.string().optional(),
		npwp: z.string().optional(),
	}),
});

/**
 * Login schema
 */
export const loginSchema = z.object({
	body: z.object({
		email: z.string().min(1, 'Email/nomor telepon harus diisi'),
		password: z.string().min(1, 'Password harus diisi'),
	}),
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
	body: z.object({
		email: z.string().email('Email tidak valid'),
	}),
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
	body: z.object({
		token: z.string().min(1, 'Token harus diisi'),
		password: z.string().min(8, 'Password minimal 8 karakter'),
	}),
});

/**
 * Verify OTP schema
 */
export const verifyOtpSchema = z.object({
	body: z.object({
		phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Nomor telepon tidak valid'),
		otp: z.string().length(6, 'Kode OTP harus 6 digit'),
	}),
});
