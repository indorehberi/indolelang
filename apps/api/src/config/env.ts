import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  JWT_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)).default('1025'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().default('noreply@indo-lelang.com'),

  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('auto'),
  AWS_ENDPOINT: z.string().optional(),
  AWS_S3_BUCKET: z.string().default('indo-lelang-assets-dev'),

  VERIHUBS_API_KEY: z.string().optional(),
  VERIHUBS_APP_ID: z.string().optional(),

  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),
  MIDTRANS_IS_PRODUCTION: z.string().transform((val) => val === 'true').default('false'),
  MIDTRANS_NOTIFICATION_URL: z.string().optional(),
  XENDIT_API_KEY: z.string().optional().default('dummy-xendit-api-key'),
  GOOGLE_CLIENT_ID: z.string().optional().transform(val => val ? val.replace(/^["']|["']$/g, '').trim() : val).default('YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'),
});

let envParsed;
try {
  // Support both test and other environments by fallback validation
  envParsed = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missing = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
    console.error('❌ Environment validation failed:\n', missing);
  } else {
    console.error('❌ Unknown environment loading error:', error);
  }
  process.exit(1);
}

export const env = envParsed;
