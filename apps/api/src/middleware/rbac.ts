import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { Role } from '@indo-lelang/shared-types';

/**
 * Middleware to restrict route access by user roles
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError(401, ErrorCode.UNAUTHORIZED, 'Pengguna belum terautentikasi');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError(
          403,
          ErrorCode.FORBIDDEN,
          'Anda tidak memiliki akses ke resource ini'
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export default authorize;
