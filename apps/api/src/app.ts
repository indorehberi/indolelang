import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import errorHandler from './middleware/errorHandler';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import branchRoutes from './modules/branches/branches.routes';
import assetRoutes from './modules/assets/assets.routes';
import lotRoutes from './modules/lots/lots.routes';
import sessionRoutes from './modules/sessions/sessions.routes';
import controlRoutes from './modules/sessions/control.routes';
import depositRoutes from './modules/deposits/deposits.routes';
import paymentRoutes from './modules/payments/payments.routes';
import documentRoutes from './modules/documents/documents.routes';
import kycRoutes from './modules/kyc/kyc.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import settingRoutes from './modules/settings/settings.routes';
import auditRoutes from './modules/audit-logs/audit-logs.routes';
import blogRoutes from './modules/blogs/blogs.routes';
import testimonialRoutes from './modules/testimonials/testimonials.routes';
import uploadRoutes from './modules/upload/upload.routes';
import testRoutes from './modules/test/test.routes';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        ...env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      ];
      
      if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

const apiPrefix = env.API_PREFIX || '/api/v1';

// Routes mounted directly under prefix
app.use(apiPrefix, userRoutes);
app.use(apiPrefix, branchRoutes);
app.use(apiPrefix, assetRoutes);
app.use(apiPrefix, lotRoutes);
app.use(apiPrefix, sessionRoutes);
app.use(apiPrefix, controlRoutes);
app.use(apiPrefix, depositRoutes);
app.use(apiPrefix, paymentRoutes);
app.use(apiPrefix, documentRoutes);
app.use(apiPrefix, kycRoutes);
app.use(apiPrefix, notificationRoutes);
app.use(apiPrefix, settingRoutes);
app.use(apiPrefix, auditRoutes);
app.use(apiPrefix, blogRoutes);
app.use(apiPrefix, testimonialRoutes);

// Routes mounted with specific resource prefixes
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/upload`, uploadRoutes);
app.use(`${apiPrefix}/test`, testRoutes);

// 404 handler for unmatched API routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
    },
  });
});

// Global error handler
app.use(errorHandler);

export default app;
