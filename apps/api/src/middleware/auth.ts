import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { AppError } from '../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { Role } from '@indo-lelang/shared-types';

/**
 * Middleware to authenticate requests using JWT access token.
 * Reads token from Authorization header (Bearer) or cookies.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Check cookies as fallback
    if (!token && req.cookies) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError(401, ErrorCode.UNAUTHORIZED, 'Token autentikasi tidak ditemukan');
    }

    try {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role as Role,
        status: decoded.status,
      };
      return next();
    } catch (err) {
      throw new AppError(401, ErrorCode.UNAUTHORIZED, 'Token tidak valid atau kedaluwarsa');
    }
  } catch (error) {
    return next(error);
  }
}

export default authenticate;
