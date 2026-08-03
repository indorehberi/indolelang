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
import { sendWhatsAppOtp, sendWhatsAppNotification } from '../../lib/whatsapp';
import { isFeatureEnabled, FEAT_WHATSAPP_OTP } from '../../lib/featureToggle';
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
		const existingEmail = await prisma.users.findFirst({
			where: { email: data.email, deleted_at: null },
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
		if (data.phone) {
			const existingPhone = await prisma.users.findFirst({
				where: { phone: data.phone, deleted_at: null },
			});
			if (existingPhone) {
				if (existingPhone.status === UserStatus.PENDING) {
					// Delete the pending user so they can register again
					await prisma.users.delete({ where: { id: existingPhone.id } }).catch(() => {});
				} else {
					throw new AppError(409, ErrorCode.USER_ALREADY_EXISTS, 'Nomor telepon sudah terdaftar');
				}
			}
		}

		// 3. Hash password
		const passwordHash = await hashPassword(data.password);

		// Status awal bergantung pada apakah OTP WhatsApp sedang dipakai.
		//
		// PENDING artinya "menunggu verifikasi". Kalau pengiriman OTP sedang
		// dimatikan, tidak ada satu pun jalan bagi peserta untuk keluar dari
		// keadaan itu — mereka akan menunggu kode yang tidak akan pernah
		// dikirim, dan daftar admin dipenuhi akun yang seolah butuh tindakan
		// padahal tidak ada yang bisa dilakukan. Karena itu saat OTP mati,
		// akunnya langsung aktif.
		const whatsappOtpAktif = await isFeatureEnabled(FEAT_WHATSAPP_OTP);

		// 4. Default to Bidder role. If they want to be a provider, they can apply
		// via /providers/apply from their Bidder Dashboard later.
		const user = await prisma.users.create({
			data: {
				email: data.email,
				phone: data.phone || null,
				password_hash: passwordHash,
				full_name: data.full_name,
				role: Role.BIDDER,
				status: whatsappOtpAktif ? UserStatus.PENDING : UserStatus.ACTIVE,
			},
		});

		// 5. Track referral usage if a valid referral code was supplied
		const referralCode = (data as any).referral_code as string | undefined;
		if (referralCode) {
			const referral = await prisma.referrals.findUnique({ where: { code: referralCode.trim().toUpperCase() } });
			if (referral && referral.referrer_id !== user.id) {
				const rewardSetting = await prisma.platform_settings.findFirst({ where: { key: 'referral_reward_amount' } });
				const rewardAmount = rewardSetting ? Number(rewardSetting.value) || 0 : 0;
				await prisma.referral_usages.create({
					data: {
						referral_id: referral.id,
						referred_id: user.id,
						reward_amount: rewardAmount,
						status: 'pending',
					},
				}).catch((err) => {
					// Non-fatal: registration should still succeed even if referral tracking fails
					logger.error({ err }, 'Failed to record referral usage during registration');
				});
			}
		}

		// 6. Generate and send WhatsApp OTP if phone number is provided
		if (whatsappOtpAktif && user.phone) {
			const isProd = env.NODE_ENV === 'production';
			const sendRealOtp = process.env.SEND_REAL_OTP === 'true';
			const otpCode = isProd || sendRealOtp
				? crypto.randomInt(100000, 999999).toString()
				: '123456';

			if (redis.isOpen) {
				await redis.set(`otp:${user.phone}`, JSON.stringify({
					userId: user.id,
					code: otpCode,
					attempts: 0
				}), { EX: 300 }); // 5 minutes TTL
			} else {
				logger.warn('Redis is closed. Registration succeeded but OTP code was not saved in Redis.');
			}

			// Fire-and-forget sending so it doesn't slow down the HTTP response
			sendWhatsAppOtp(user.phone, otpCode).catch((err) => {
				logger.error({ err, phone: user.phone }, 'Failed to send WhatsApp OTP during registration');
			});
		}

		const kyc = await prisma.kyc_documents.findUnique({ where: { user_id: user.id } });

		return {
			id: user.id,
			email: user.email,
			phone: user.phone,
			full_name: data.full_name,
			role: user.role as Role,
			status: user.status as UserStatus,
			kyc_status: kyc ? kyc.status : undefined,
		};
	}

	/**
	 * Login or register user with Google OAuth (Verified with Google tokeninfo API or mock)
	 */
	async googleAuth(data: {
		email?: string;
		full_name?: string;
		google_id?: string;
		idToken?: string;
		phone?: string;
		role?: Role;
		action?: 'login' | 'register';
		company_name?: string;
		npwp?: string;
	}): Promise<LoginResponse & { refreshToken: string }> {
		let email = data.email;
		let fullName = data.full_name;

		// 1. If idToken is provided, verify it with Google APIs
		if (data.idToken) {
			try {
				const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${data.idToken}`);
				if (!response.ok) {
					throw new AppError(400, ErrorCode.UNAUTHORIZED, 'Token Google tidak valid atau kedaluwarsa');
				}
				const tokenInfo = await response.json() as any;
				
				// Verify Client ID matches if set in env
				if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
					if (tokenInfo.aud !== env.GOOGLE_CLIENT_ID) {
						logger.warn({ aud: tokenInfo.aud, client_id: env.GOOGLE_CLIENT_ID }, 'Google token client ID mismatch');
						throw new AppError(400, ErrorCode.UNAUTHORIZED, 'Aplikasi asal token Google tidak cocok');
					}
				}

				email = tokenInfo.email;
				fullName = tokenInfo.name || tokenInfo.email.split('@')[0];
			} catch (error) {
				if (error instanceof AppError) throw error;
				logger.error({ error }, 'Error validating Google idToken');
				throw new AppError(500, ErrorCode.UNAUTHORIZED, 'Gagal memverifikasi token dengan Google');
			}
		}

		if (!email) {
			throw new AppError(400, ErrorCode.INVALID_CREDENTIALS, 'Email harus dicantumkan');
		}
		if (!fullName) {
			fullName = email.split('@')[0];
		}

		// 2. Find user by email
		let user = await prisma.users.findFirst({
			where: { email: email, deleted_at: null },
			include: { kyc_document: true },
		});

		// 3. If user exists, log them in
		if (user) {
			if (user.status === UserStatus.SUSPENDED) {
				throw new AppError(403, ErrorCode.USER_SUSPENDED, 'Akun Anda ditangguhkan. Silakan hubungi admin.');
			}

			// Generate tokens
			const payload = {
				id: user.id,
				email: user.email,
				role: user.role,
				status: user.status,
			};

			const accessToken = generateAccessToken(payload);
			const refreshToken = generateRefreshToken(payload);

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
					role: user.role as Role,
					status: user.status as UserStatus,
					kyc_status: user.kyc_document ? user.kyc_document.status : undefined,
				},
			};
		}

		// 4. If user doesn't exist, register them as a bidder by default for Google OAuth.
		let role: Role = data.role || Role.BIDDER;

		// If phone number is supplied, check for duplicates
		if (data.phone) {
			const existingPhone = await prisma.users.findFirst({
				where: { phone: data.phone, deleted_at: null },
			});
			if (existingPhone) {
				throw new AppError(409, ErrorCode.USER_ALREADY_EXISTS, 'Nomor telepon sudah terdaftar');
			}
		}

		// Generate random password hash since this is an OAuth user
		const randomPassword = crypto.randomBytes(16).toString('hex');
		const passwordHash = await hashPassword(randomPassword + 'Google1!');

		user = await prisma.users.create({
			data: {
				email: email,
				phone: data.phone || null,
				password_hash: passwordHash,
				full_name: fullName,
				role: role,
				status: UserStatus.PENDING, // Google accounts must also go through KYC
			},
			include: { kyc_document: true }
		});

		// Generate tokens
		const payload = {
			id: user.id,
			email: user.email,
			role: user.role,
			status: user.status,
		};

		const accessToken = generateAccessToken(payload);
		const refreshToken = generateRefreshToken(payload);

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
				role: user.role as Role,
				status: user.status as UserStatus,
				kyc_status: undefined,
			},
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
				deleted_at: null,
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

		const maxFailures = process.env.NODE_ENV === 'production' ? 5 : 1000;
		if (failures >= maxFailures) {
			const blockDuration = process.env.NODE_ENV === 'production' ? 900 : 1;
			await redis.set(blockKey, 'blocked', { EX: blockDuration }); // Block for 15 minutes or 1 second in dev
			await redis.del(rateLimitKey);
			logger.warn({ email, clientIp }, `User blocked for ${blockDuration} seconds due to ${failures} failed login attempts`);
		}
	}

	/**
	 * Verify OTP and activate bidder account
	 */
	async verifyOtp(phone: string, otp: string): Promise<void> {
		if (!redis.isOpen) {
			// In development if Redis is down, we allow default OTP
			if (otp === '123456') {
				const user = await prisma.users.findFirst({ where: { phone, deleted_at: null } });
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
		const user = await prisma.users.findFirst({ where: { id: otpData.userId, deleted_at: null } });
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

const user = await prisma.users.findFirst({
			where: { id: decoded.id, deleted_at: null },
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

	async forgotPassword(email: string | undefined, phone: string | undefined, sendTo?: string): Promise<void> {
		const normalizePhone = (num: string) => {
			let clean = num.replace(/[^0-9]/g, '');
			if (clean.startsWith('0')) {
				clean = '62' + clean.slice(1);
			}
			return clean;
		};

		// Reset lewat WhatsApp hanya dilayani kalau salurannya memang menyala.
		// Kalau tidak, permintaan diselesaikan tanpa mengirim apa pun — sama
		// seperti perlakuan untuk nomor yang tidak terdaftar, supaya tidak ada
		// cara menebak nomor mana yang ada di sistem.
		if (sendTo === 'whatsapp' && !(await isFeatureEnabled(FEAT_WHATSAPP_OTP))) {
			logger.info('Permintaan reset password lewat WhatsApp diabaikan: saluran WhatsApp sedang dimatikan');
			return;
		}

		let user;

		if (sendTo === 'whatsapp' && phone) {
			// Lookup by phone number
			const normalized = normalizePhone(phone);
			const allUsers = await prisma.users.findMany({ where: { deleted_at: null } });
			user = allUsers.find((u) => u.phone && normalizePhone(u.phone) === normalized);
		} else {
			// Default: lookup by email
			if (!email) return;
			user = await prisma.users.findFirst({ where: { email, deleted_at: null } });
		}

		if (!user) {
			// To prevent user enumeration, we resolve successfully without throwing
			return;
		}

		const resetToken = crypto.randomBytes(32).toString('hex');

		if (redis.isOpen) {
			await redis.set(`reset_password:${resetToken}`, user.id, {
				EX: 3600, // 1 hour
			});
		}

		// CORS_ORIGIN may be comma-separated in production (e.g. "https://bidku.co.id,http://localhost:3000")
		// Always use the first (primary) origin as the public-facing URL
		const primaryOrigin = (env.CORS_ORIGIN || '').split(',')[0].trim();
		const resetUrl = `${primaryOrigin}/reset-password?token=${resetToken}`;
		const subject = 'Reset Password Akun Indo-Lelang';
		const text = `Halo,\n\nAnda menerima email ini karena Anda (atau orang lain) meminta untuk mengatur ulang kata sandi akun Anda.\n\nSilakan klik tautan di bawah ini atau salin ke browser Anda untuk menyelesaikan proses:\n\n${resetUrl}\n\nTautan ini akan kedaluwarsa dalam 1 jam.\n\nJika Anda tidak meminta ini, abaikan email ini.`;
		const html = `<p>Halo,</p><p>Anda menerima email ini karena Anda meminta reset password akun Indo-Lelang.</p><p>Silakan klik tombol di bawah ini untuk mengatur ulang kata sandi Anda:</p><p><a href="${resetUrl}" style="padding: 10px 20px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p><p>Tautan ini akan kedaluwarsa dalam 1 jam.</p>`;

		try {
			if (!sendTo || sendTo === 'email') {
				if (user.email) {
					await sendEmail({ to: user.email, subject, text, html });
				}
			}

			// Send WhatsApp reset link if user has a registered phone
			if (user.phone && sendTo === 'whatsapp') {
				const waMessage = `[Indo-Lelang] Halo, Anda menerima pesan ini karena meminta reset password untuk akun Anda.\n\nSilakan klik tautan berikut untuk mengatur ulang kata sandi Anda:\n${resetUrl}\n\nTautan ini berlaku selama 1 jam. Jika Anda tidak meminta ini, silakan abaikan pesan ini.`;
				sendWhatsAppNotification(user.phone, waMessage).catch((err) => {
					logger.error({ err, phone: user.phone }, 'Failed to send password reset WhatsApp notification');
				});
			}
		} catch (emailError) {
			logger.error({ emailError, email: user.email }, 'Failed to send password reset email');
			console.log('\n==================================================');
			console.log(`[DEBUG / DEV ONLY] PASSWORD RESET LINK FOR ${user.email || user.phone}:`);
			console.log(resetUrl);
			console.log('==================================================\n');
			throw new AppError(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Gagal mengirim link reset password. Silakan coba beberapa saat lagi atau hubungi admin.');
		}
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
