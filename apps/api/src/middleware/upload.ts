import multer from 'multer';
import { S3_CONFIG } from '../config/s3';
import { Request } from 'express';

// Store files in memory for processing before S3 upload
const storage = multer.memoryStorage();

// File filter to validate uploads
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (S3_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipe file tidak diizinkan: ${file.mimetype}`));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: S3_CONFIG.maxFileSize,
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string = 'file') => upload.single(fieldName);

// Middleware for multiple files upload
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 5) => 
  upload.array(fieldName, maxCount);

// Middleware for multiple fields
export const uploadFields = (fields: { name: string; maxCount: number }[]) => 
  upload.fields(fields);
