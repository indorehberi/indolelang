import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../lib/apiResponse';
import { env } from '../../config/env';

const authService = new AuthService();

export class AuthController {
	/**
	 * Register a new user
	 */
	async register(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const user = await authService.register(req.body);
			sendSuccess(res, user, 'Registrasi berhasil. Silakan verifikasi nomor telepon Anda dengan OTP.', undefined, 201);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Login user
	 */
	async login(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { email, password } = req.body;
			const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

			const { accessToken, refreshToken, user } = await authService.login(email, password, clientIp);

			// Set Refresh Token in HttpOnly cookie
			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: env.NODE_ENV === 'production',
				sameSite: 'strict',
				path: `${env.API_PREFIX}/auth`,
				maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
			});

			sendSuccess(res, { accessToken, user }, 'Login berhasil');
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Logout user and clear cookies
	 */
	async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			res.clearCookie('refreshToken', {
				httpOnly: true,
				secure: env.NODE_ENV === 'production',
				sameSite: 'strict',
				path: `${env.API_PREFIX}/auth`,
			});
			sendSuccess(res, null, 'Logout berhasil');
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Refresh the access token using cookie
	 */
	async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
			const result = await authService.refreshToken(refreshToken);
			sendSuccess(res, result, 'Token berhasil diperbarui');
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Forgot password request
	 */
	async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { email } = req.body;
			await authService.forgotPassword(email);
			sendSuccess(res, null, 'Link reset password telah dikirim ke email Anda jika terdaftar');
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Reset password using token
	 */
	async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { token, password } = req.body;
			await authService.resetPassword(token, password);
			sendSuccess(res, null, 'Kata sandi Anda berhasil diperbarui');
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Verify registration OTP
	 */
	async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { phone, otp } = req.body;
			await authService.verifyOtp(phone, otp);
			sendSuccess(res, null, 'Nomor telepon berhasil diverifikasi. Akun Anda telah aktif.');
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Login or register with Google
	 */
	async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const result = await authService.googleAuth(req.body);

			// Set Refresh Token in HttpOnly cookie
			res.cookie('refreshToken', result.refreshToken, {
				httpOnly: true,
				secure: env.NODE_ENV === 'production',
				sameSite: 'strict',
				path: `${env.API_PREFIX}/auth`,
				maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
			});

			sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Login Google berhasil');
		} catch (error) {
			next(error);
		}
	}
}

export default AuthController;
