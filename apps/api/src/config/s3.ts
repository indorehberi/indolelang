import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

export const s3Client = new S3Client({
  region: env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const S3_CONFIG = {
  bucket: env.AWS_S3_BUCKET || 'indo-lelang',
  region: env.AWS_REGION || 'ap-southeast-1',
  urlExpiration: 3600, // 1 hour for presigned URLs
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf',
  ],
};
