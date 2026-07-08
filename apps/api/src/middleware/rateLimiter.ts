import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { AppError } from '../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { logger } from '../lib/logger';

interface RateLimitOptions {
  windowSeconds?: number;
  maxRequests?: number;
  keyPrefix?: string;
  errorMessage?: string;
}

/**
 * Redis-based rate limiting middleware
 */
export function rateLimiter(options: RateLimitOptions = {}) {
  const windowSeconds = options.windowSeconds ?? 1;
  const maxRequests = options.maxRequests ?? 10; // Default 10 req/sec per user/IP
  const keyPrefix = options.keyPrefix ?? 'rate_limit';
  const errorMessage =
    options.errorMessage ?? 'Batas laju permintaan terlampaui. Silakan coba sesaat lagi.';

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // If redis is not open or running in dev/test, skip rate limiting so service stays up and tests can run
      if (!redis.isOpen || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        return next();
      }

      const identifier = (req as any).user?.id || req.ip || 'anonymous';
      const path = req.route?.path || req.path;
      const key = `${keyPrefix}:${req.method}:${path}:${identifier}`;

      const currentRequests = await redis.incr(key);

      if (currentRequests === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (currentRequests > maxRequests) {
        throw new AppError(429, ErrorCode.RATE_LIMIT_EXCEEDED, errorMessage);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export default rateLimiter;
