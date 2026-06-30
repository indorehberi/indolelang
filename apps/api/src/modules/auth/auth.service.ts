import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import {
	RegisterRequest,
	AuthUser,
	LoginResponse,
	AuthTokens,
} from '@indo-lelang/shared-types';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { hashPassword, comparePassword } from '../../lib/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { sendEmail } from '../../lib/email';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import crypto from 'crypto';
import { Role, UserStatus } from '@indo-lelang/shared-types';

export class AuthService {
	/**
	 * Register a new bidder or provider user
	 */
	async register(data: RegisterRequest): Promise<AuthUser> {
		// 1. Check if email exists
		const existingEmail = await prisma.users.findUnique({
			where: { email: data.email },
		});
		if (existingEmail) {
			if (existingEmail.status === UserStatus.PENDING) {
				// Delete the pending user so they can register again
				await prisma.users.delete({ where: { id: existingEmail.id } }).catch(() => {});
			} else {
				throw new AppError(409, ErrorCode.USER_ALREADY_EXISTS, 'Email sudah terdaftar');
			}
		}

		// 2. Check if phone exists
		const existingPhone = await prisma.users.findUnique({
			where: { phone: data.phone },
		});
		if (existingPhone) {
			if (existingPhone.status === UserStatus.PENDING) {
				// Delete the pending user so they can register again
				await prisma.users.delete({ where: { id: existingPhone.id } }).catch(() => {});
			} else {
				throw new AppError(409, ErrorCode.USER_ALREADY_EXISTS, 'Nomor telepon sudah terdaftar');
			}
		}

		// 3. Hash password
		const passwordHash = await hashPassword(data.password);

		// 4. Create user
		const user = await prisma.users.create({
			data: {
				email: data.email,
				phone: data.phone,
				password_hash: passwordHash,
				full_name: data.full_name,
				role: data.role,
				status: UserStatus.PENDING,
				company_name: data.role === Role.PROVIDER ? data.company_name : null,
				npwp: data.role === Role.PROVIDER ? data.npwp : null,
			},
		});

		try {
			// 5. Generate and store OTP in Redis
			const otpCode = env.NODE_ENV === 'production'
				? Math.floor(100000 + Math.random() * 900000).toString()
				: '123456';

			const otpData = {
				code: otpCode,
				attempts: 0,
				userId: user.id,
			};

			if (redis.isOpen) {
				await redis.set(`otp:${data.phone}`, JSON.stringify(otpData), {
					EX: 300, // 5 minutes
				});
			}

			logger.info({ phone: data.phone, otpCode }, 'OTP generated for registration');

			// Send OTP to email
			await sendEmail({
				to: data.email,
				subject: 'Kode OTP Registrasi Indo-Lelang',
				text: `Halo ${data.full_name},\n\nKode OTP Anda untuk pendaftaran di Indo-Lelang adalah: ${otpCode}.\nKode ini berlaku selama 5 menit.\n\nTerima kasih.`,
				html: `<p>Halo <strong>${data.full_name}</strong>,</p><p>Kode OTP Anda untuk pendaftaran di Indo-Lelang adalah: <strong>${otpCode}</strong>.</p><p>Kode ini berlaku selama 5 menit.</p><p>Terima kasih.</p>`,
			});
		} catch (error) {
			// Rollback user creation if subsequent steps (Redis or Email) fail
			await prisma.users.delete({ where: { id: user.id } }).catch((delErr) => {
				logger.error({ delErr, userId: user.id }, 'Failed to delete user during registration rollback');
			});
			throw error;
		}

		const kyc = await prisma.kyc_documents.findUnique({ where: { user_id: user.id } });

		return {
			id: user.id,
			email: user.email,
			phone: user.phone,
			full_name: data.full_name,
			role: user.role,
			status: user.status,
			kyc_status: kyc ? kyc.status : undefined,
		};
	}

	/**
	 * Login user and generate access/refresh tokens
	 */
	async login(email: string, password: string, clientIp: string): Promise<LoginResponse & { refreshToken: string }> {
		const rateLimitKey = `login_failures:${email}:${clientIp}`;
		const blockKey = `login_block:${email}:${clientIp}`;

		// 1. Check if blocked
		if (redis.isOpen) {
			const isBlocked = await redis.get(blockKey);
			if (isBlocked) {
				throw new AppError(
					429,
					ErrorCode.RATE_LIMIT_EXCEEDED,
					'Terlalu banyak percobaan login gagal. Anda diblokir selama 15 menit.'
				);
			}
		}

		// 2. Find user (by email or phone)
		const user = await prisma.users.findFirst({
			where: {
				OR: [
					{ email: email },
					{ phone: email }
				]
			},
			include: {
				kyc_document: true
			}
		});

		if (!user) {
			await this.handleFailedLogin(email, clientIp);
			throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, 'Email/nomor telepon atau kata sandi salah');
		}

		// 3. Verify password
		const isPasswordValid = await comparePassword(password, user.password_hash);
		if (!isPasswordValid) {
			await this.handleFailedLogin(email, clientIp);
			throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, 'Email/nomor telepon atau kata sandi salah');
		}

		// 4. Check user status
		if (user.status === UserStatus.SUSPENDED) {
			throw new AppError(403, ErrorCode.USER_SUSPENDED, 'Akun Anda ditangguhkan. Silakan hubungi admin.');
		}

		// 5. Reset login failures
		if (redis.isOpen) {
			await redis.del(rateLimitKey);
		}

		// 6. Generate tokens
		const payload = {
			id: user.id,
			email: user.email,
			role: user.role,
			status: user.status,
		};

		const accessToken = generateAccessToken(payload);
		const refreshToken = generateRefreshToken(payload);

		// Save refresh token in Redis for tracking/revocation (optional, but good practice)
		if (redis.isOpen) {
			await redis.set(`refresh_token:${user.id}`, refreshToken, {
				EX: 30 * 24 * 60 * 60, // 30 days
			});
		}

		return {
			accessToken,
			refreshToken,
			user: {
				id: user.id,
				email: user.email,
				phone: user.phone,
				full_name: user.full_name,
				role: user.role,
				status: user.status,
				kyc_status: user.kyc_document ? user.kyc_document.status : undefined,
			},
		};
	}

	/**
	 * Helper to track failed login attempts and block IP/accounts
	 */
	private async handleFailedLogin(email: string, clientIp: string): Promise<void> {
		if (!redis.isOpen) return;

		const rateLimitKey = `login_failures:${email}:${clientIp}`;
		const blockKey = `login_block:${email}:${clientIp}`;

		const failures = await redis.incr(rateLimitKey);
		if (failures === 1) {
			await redis.expire(rateLimitKey, 900); // 15 minutes window
		}

		if (failures >= 5) {
			await redis.set(blockKey, 'blocked', { EX: 900 }); // Block for 15 minutes
			await redis.del(rateLimitKey);
			logger.warn({ email, clientIp }, 'User blocked for 15 minutes due to 5 failed login attempts');
		}
	}

	/**
	 * Verify OTP and activate bidder account
	 */
	async verifyOtp(phone: string, otp: string): Promise<void> {
		if (!redis.isOpen) {
			// In development if Redis is down, we allow default OTP
			if (otp === '123456') {
				const user = await prisma.users.findUnique({ where: { phone } });
				if (user && user.status === UserStatus.PENDING) {
					await prisma.users.update({
						where: { id: user.id },
						data: { status: UserStatus.ACTIVE },
					});
				}
				return;
			}
			throw new AppError(500, ErrorCode.DB_ERROR, 'Redis tidak tersedia');
		}

		const otpDataStr = await redis.get(`otp:${phone}`);
		if (!otpDataStr) {
			throw new AppError(400, ErrorCode.OTP_EXPIRED, 'Kode OTP kedaluwarsa atau tidak ditemukan');
		}

		const otpData = JSON.parse(otpDataStr);

		if (otpData.code !== otp) {
			otpData.attempts += 1;

			if (otpData.attempts >= 5) {
				await redis.del(`otp:${phone}`);
				throw new AppError(400, ErrorCode.OTP_EXPIRED, 'Batas percobaan OTP habis. Silakan ajukan OTP baru.');
			}

			const ttl = await redis.ttl(`otp:${phone}`);
			if (ttl > 0) {
				await redis.set(`otp:${phone}`, JSON.stringify(otpData), { EX: ttl });
			}

			throw new AppError(400, ErrorCode.OTP_INVALID, `Kode OTP tidak cocok (Sisa percobaan: ${5 - otpData.attempts})`);
		}

		// OTP matched
		await redis.del(`otp:${phone}`);

		// Activate user
		const user = await prisma.users.findUnique({ where: { id: otpData.userId } });
		if (user && user.status === UserStatus.PENDING) {
			await prisma.users.update({
				where: { id: user.id },
				data: { status: UserStatus.ACTIVE },
			});
		}
	}

	/**
	 * Refresh the access token using a valid refresh token
	 */
	async refreshToken(token: string): Promise<AuthTokens> {
		try {
			const decoded = verifyRefreshToken(token);

			const user = await prisma.users.findUnique({
				where: { id: decoded.id },
			});

			if (!user) {
				throw new AppError(401, ErrorCode.UNAUTHORIZED, 'Pengguna tidak ditemukan');
			}

			if (user.status === UserStatus.SUSPENDED) {
				throw new AppError(403, ErrorCode.USER_SUSPENDED, 'Akun ditangguhkan');
			}

			const accessToken = generateAccessToken({
				id: user.id,
				email: user.email,
				role: user.role,
				status: user.status,
			});

			return { accessToken };
		} catch (err) {
			throw new AppError(401, ErrorCode.UNAUTHORIZED, 'Token refresh tidak valid atau kedaluwarsa');
		}
	}

	/**
	 * Handle forgot password request, sending email reset link
	 */
	async forgotPassword(email: string): Promise<void> {
		const user = await prisma.users.findUnique({ where: { email } });
		if (!user) {
			// return success even if email not found to prevent user enumeration
			logger.info({ email }, 'Forgot password email lookup missed (hidden)');
			return;
		}

		const resetToken = crypto.randomBytes(32).toString('hex');

		if (redis.isOpen) {
			await redis.set(`reset_password:${resetToken}`, user.id, {
				EX: 3600, // 1 hour
			});
		}

		const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${resetToken}`;
		const subject = 'Reset Password Akun Indo-Lelang';
		const text = `Halo,\n\nAnda menerima email ini karena Anda (atau orang lain) meminta untuk mengatur ulang kata sandi akun Anda.\n\nSilakan klik tautan di bawah ini atau salin ke browser Anda untuk menyelesaikan proses:\n\n${resetUrl}\n\nTautan ini akan kedaluwarsa dalam 1 jam.\n\nJika Anda tidak meminta ini, abaikan email ini.`;
		const html = `<p>Halo,</p><p>Anda menerima email ini karena Anda meminta reset password akun Indo-Lelang.</p><p>Silakan klik tombol di bawah ini untuk mengatur ulang kata sandi Anda:</p><p><a href="${resetUrl}" style="padding: 10px 20px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p><p>Tautan ini akan kedaluwarsa dalam 1 jam.</p>`;

		await sendEmail({ to: email, subject, text, html });
	}

	/**
	 * Reset user password using token
	 */
	async resetPassword(token: string, passwordRaw: string): Promise<void> {
		if (!redis.isOpen) {
			throw new AppError(500, ErrorCode.DB_ERROR, 'Redis tidak tersedia');
		}

		const userId = await redis.get(`reset_password:${token}`);
		if (!userId) {
			throw new AppError(400, ErrorCode.INVALID_CREDENTIALS, 'Token reset sandi tidak valid atau kedaluwarsa');
		}

		const passwordHash = await hashPassword(passwordRaw);

		await prisma.users.update({
			where: { id: userId },
			data: { password_hash: passwordHash },
		});

		await redis.del(`reset_password:${token}`);
	}
}
