import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validator';
import { rateLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from './auth.schema';

const router = Router();
const controller = new AuthController();

// 1. Register - limit 3 requests per hour
router.post(
  '/register',
  rateLimiter({
    windowSeconds: 3600,
    maxRequests: 3,
    keyPrefix: 'rl:register',
    errorMessage: 'Batas pendaftaran akun terlampaui. Silakan coba lagi dalam satu jam.',
  }),
  validate(registerSchema),
  controller.register
);

// 2. Login - limit 5 requests per 15 minutes (also handled internally for IP lock)
router.post(
  '/login',
  rateLimiter({
    windowSeconds: 900,
    maxRequests: 5,
    keyPrefix: 'rl:login',
    errorMessage: 'Batas percobaan login terlampaui. Silakan coba lagi dalam 15 menit.',
  }),
  validate(loginSchema),
  controller.login
);

// 3. Logout
router.post('/logout', controller.logout);

// 4. Refresh Token
router.post('/refresh-token', controller.refreshToken);

// 5. Forgot Password - limit 3 requests per hour
router.post(
  '/forgot-password',
  rateLimiter({
    windowSeconds: 3600,
    maxRequests: 3,
    keyPrefix: 'rl:forgot-password',
    errorMessage: 'Batas permintaan reset kata sandi terlampaui. Silakan coba lagi dalam satu jam.',
  }),
  validate(forgotPasswordSchema),
  controller.forgotPassword
);

// 6. Reset Password
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  controller.resetPassword
);

// 7. Verify OTP - limit 5 requests per 15 minutes
router.post(
  '/verify-otp',
  rateLimiter({
    windowSeconds: 900,
    maxRequests: 5,
    keyPrefix: 'rl:verify-otp',
    errorMessage: 'Batas verifikasi OTP terlampaui. Silakan coba lagi dalam 15 menit.',
  }),
  validate(verifyOtpSchema),
  controller.verifyOtp
);

export default router;
