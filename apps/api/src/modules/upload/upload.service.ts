import { uploadToS3, deleteFromS3, getPresignedUrl as getS3PresignedUrl, validateFile } from '../../lib/upload';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';

interface UploadOptions {
  folder?: string;
  optimize?: boolean;
  resize?: { width: number; height: number };
}

/**
 * Upload single file to S3
 */
export async function uploadFile(file: Express.Multer.File, options: UploadOptions = {}) {
  const validation = validateFile(file);
  
  if (!validation.valid) {
    throw new AppError(400, ErrorCode.VALIDATION_ERROR, validation.error || 'File tidak valid');
  }

  return await uploadToS3(file, options);
}

/**
 * Upload multiple files to S3
 */
export async function uploadMultipleFiles(files: Express.Multer.File[], options: UploadOptions = {}) {
  const results = [];

  for (const file of files) {
    const validation = validateFile(file);
    
    if (!validation.valid) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, validation.error || 'File tidak valid');
    }

    const result = await uploadToS3(file, options);
    results.push(result);
  }

  return results;
}

/**
 * Delete file from S3
 */
export async function deleteFile(key: string) {
  return await deleteFromS3(key);
}

/**
 * Get presigned URL for private file
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600) {
  return await getS3PresignedUrl(key, expiresIn);
}
