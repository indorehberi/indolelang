import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '@indo-lelang/shared-types';

/**
 * Send standard success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operasi berhasil',
  meta?: PaginationMeta,
  statusCode = 200
): Response {
  const responseBody: ApiResponse<T> = {
    success: true,
    data,
    message,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(responseBody);
}

/**
 * Send standard error response
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  details?: Record<string, unknown>,
  statusCode = 400
): Response {
  const responseBody: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(responseBody);
}
