import { Router } from 'express';
import * as uploadController from './upload.controller';
import { uploadSingle, uploadMultiple } from '../../middleware/upload';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * @route   POST /api/upload/single
 * @desc    Upload single file to S3
 * @access  Private (authenticated users)
 */
router.post(
  '/single',
  authenticate,
  uploadSingle('file'),
  uploadController.uploadFile
);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files to S3
 * @access  Private (authenticated users)
 */
router.post(
  '/multiple',
  authenticate,
  uploadMultiple('files', 10),
  uploadController.uploadMultipleFiles
);

/**
 * @route   DELETE /api/upload/:key
 * @desc    Delete file from S3
 * @access  Private (authenticated users)
 */
router.delete(
  '/:key',
  authenticate,
  uploadController.deleteFile
);

/**
 * @route   GET /api/upload/presigned/:key
 * @desc    Get presigned URL for private file
 * @access  Private (authenticated users)
 */
router.get(
  '/presigned/:key',
  authenticate,
  uploadController.getPresignedUrl
);

export default router;
