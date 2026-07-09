import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { sendError } from '../lib/apiResponse';
import { logger } from '../lib/logger';

/**
 * Express global error handling middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    logger.warn(
      {
        path: req.path,
        method: req.method,
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
      },
      'Operational error handled'
    );
    sendError(res, err.code, err.message, err.details, err.statusCode);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    const details: Record<string, string> = {};
    err.errors.forEach((e) => {
      const pathStr = e.path.join('.');
      details[pathStr] = e.message;
    });

    logger.warn({ path: req.path, method: req.method, details }, 'Validation error handled');
    sendError(res, ErrorCode.VALIDATION_ERROR, `Validasi input gagal: ${JSON.stringify(details)}`, details, 400);
    return;
  }

  // Handle Prisma database errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(
      {
        path: req.path,
        method: req.method,
        prismaCode: err.code,
        message: err.message,
      },
      'Prisma client error'
    );

    // Unique constraint violation (e.g. email already exists)
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      const field = target.join(', ');
      sendError(
        res,
        ErrorCode.USER_ALREADY_EXISTS,
        `Data dengan ${field} tersebut sudah terdaftar`,
        undefined,
        409
      );
      return;
    }

    // Record not found
    if (err.code === 'P2025') {
      sendError(res, ErrorCode.NOT_FOUND, 'Data tidak ditemukan', undefined, 404);
      return;
    }

    // Other Prisma errors
    sendError(res, ErrorCode.DB_ERROR, 'Kegagalan transaksi database', undefined, 500);
    return;
  }

  // Unhandled internal server errors
  logger.error(
    {
      path: req.path,
      method: req.method,
      err: {
        message: err.message,
        stack: err.stack,
      },
    },
    'Unhandled server error occurred'
  );

  sendError(
    res,
    ErrorCode.INTERNAL_SERVER_ERROR,
    'Terjadi kesalahan internal pada server',
    undefined,
    500
  );
}
export default errorHandler;
