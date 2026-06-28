import { Request, Response, NextFunction } from 'express';
import * as uploadService from './upload.service';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';

/**
 * Upload single file
 */
export async function uploadFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'File tidak ditemukan');
    }

    const folder = req.body.folder || 'uploads';
    const optimize = req.body.optimize !== 'false';

    const result = await uploadService.uploadFile(req.file, { folder, optimize });

    res.status(200).json({
      success: true,
      message: 'File berhasil diupload',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Files tidak ditemukan');
    }

    const folder = req.body.folder || 'uploads';
    const optimize = req.body.optimize !== 'false';

    const results = await uploadService.uploadMultipleFiles(req.files, { folder, optimize });

    res.status(200).json({
      success: true,
      message: `${results.length} file berhasil diupload`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete file from S3
 */
export async function deleteFile(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;

    if (!key) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Key file tidak ditemukan');
    }

    await uploadService.deleteFile(key);

    res.status(200).json({
      success: true,
      message: 'File berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get presigned URL for private file
 */
export async function getPresignedUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;
    const expiresIn = parseInt(req.query.expiresIn as string) || 3600;

    if (!key) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Key file tidak ditemukan');
    }

    const url = await uploadService.getPresignedUrl(key, expiresIn);

    res.status(200).json({
      success: true,
      data: { url, expiresIn },
    });
  } catch (error) {
    next(error);
  }
}
