import { z } from 'zod';
import { Role } from '@indo-lelang/shared-types';

/**
 * Register schema - for bidder and provider registration
 */
export const registerSchema = z.object({
	body: z.object({
		email: z.string().email('Email tidak valid'),
		phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Nomor telepon tidak valid').optional(),
		password: z.string().min(8, 'Password minimal 8 karakter'),
		confirm_password: z.string().min(1, 'Konfirmasi password harus diisi'),
		full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
		role: z.enum([Role.BIDDER, Role.PROVIDER]).optional(),
		company_name: z.string().optional(),
		npwp: z.string().optional(),
		referral_code: z.string().optional(),
	}).refine((data) => data.password === data.confirm_password, {
		message: 'Konfirmasi password tidak cocok',
		path: ['confirm_password'],
	}),
});

/**
 * Google Auth schema
 */
export const googleAuthSchema = z.object({
	body: z.object({
		email: z.string().email('Email tidak valid').optional(),
		full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter').optional(),
		google_id: z.string().optional(),
		idToken: z.string().optional(),
		phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Nomor telepon tidak valid').optional(),
		role: z.enum([Role.BIDDER, Role.PROVIDER], {
			errorMap: () => ({ message: 'Role harus bidder atau provider' }),
		}).optional(),
		action: z.enum(['login', 'register']).optional(),
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
		phone: z.string().min(8, 'Nomor WhatsApp minimal 8 karakter'),
		send_to: z.enum(['email', 'whatsapp']).optional(),
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
