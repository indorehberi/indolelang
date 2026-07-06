import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_CONFIG } from '../config/s3';
import { env } from '../config/env';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';

export interface UploadOptions {
  folder?: string;
  resize?: { width: number; height: number };
  optimize?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  mimeType: string;
}

/**
 * Upload file to S3 with optional image processing
 */
export async function uploadToS3(
  file: Express.Multer.File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = 'uploads', resize, optimize = true } = options;

  // Generate unique filename
  const ext = path.extname(file.originalname);
  const filename = `${crypto.randomUUID()}${ext}`;
  const key = `${folder}/${filename}`;

  let fileBuffer = file.buffer;
  let contentType = file.mimetype;

  // Process image if needed
  if (file.mimetype.startsWith('image/') && (resize || optimize)) {
    let sharpInstance = sharp(file.buffer);

    if (resize) {
      sharpInstance = sharpInstance.resize(resize.width, resize.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (optimize) {
      sharpInstance = sharpInstance.jpeg({ quality: 85, progressive: true });
      contentType = 'image/jpeg';
    }

    fileBuffer = await sharpInstance.toBuffer();
  }

  const isDummyS3 = !env.AWS_ACCESS_KEY_ID || 
                    env.AWS_ACCESS_KEY_ID.includes('dummy') || 
                    env.AWS_ACCESS_KEY_ID.includes('your-') ||
                    env.AWS_ACCESS_KEY_ID === '';

  try {
    if (isDummyS3) {
      throw new Error('S3 credentials are dummy or empty, fallback to local file system.');
    }

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Generate public URL
    const url = `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${key}`;

    return {
      key,
      url,
      bucket: S3_CONFIG.bucket,
      size: fileBuffer.length,
      mimeType: contentType,
    };
  } catch (error) {
    // Local File Storage Fallback
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    await fsPromises.writeFile(filePath, fileBuffer);

    const hostUrl = process.env.API_URL || 'http://localhost:8000';
    const url = `${hostUrl}/uploads/${folder}/${filename}`;

    return {
      key,
      url,
      bucket: 'local-storage',
      size: fileBuffer.length,
      mimeType: contentType,
    };
  }
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate presigned URL for private file access
 */
export async function getPresignedUrl(key: string, expiresIn: number = S3_CONFIG.urlExpiration): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Validate file before upload
 */
export function validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'File tidak ditemukan' };
  }

  if (file.size > S3_CONFIG.maxFileSize) {
    return { 
      valid: false, 
      error: `Ukuran file terlalu besar. Maksimal ${S3_CONFIG.maxFileSize / 1024 / 1024}MB` 
    };
  }

  if (!S3_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    return { 
      valid: false, 
      error: `Tipe file tidak diizinkan. Hanya: ${S3_CONFIG.allowedMimeTypes.join(', ')}` 
    };
  }

  return { valid: true };
}
