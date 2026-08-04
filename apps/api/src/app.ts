import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import errorHandler from './middleware/errorHandler';
import { logger } from './lib/logger';

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
import publicRoutes from './modules/public/public.routes';
import healthRoutes from './modules/health/health.routes';
import niplRoutes from './modules/nipl/nipl.routes';
import campaignRoutes from './modules/campaigns/campaigns.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import contactMessagesRoutes from './modules/contact-messages/contact-messages.routes';
import checkoutRoutes from './modules/checkout/checkout.routes';
import galleryRoutes from './modules/galleries/galleries.routes';
import bidderRoutes from './modules/bidders/bidders.routes';
import providerRoutes from './modules/providers/providers.routes';
import referralRoutes from './modules/referrals/referrals.routes';
const app = express();

// Trust the first reverse proxy (Nginx / Load Balancer / Docker) so that
// req.ip returns the real client IP from X-Forwarded-For instead of the
// proxy's own address.  Without this, every user behind the proxy shares
// the same rate-limit bucket and gets blocked after just a few requests.
app.set('trust proxy', 1);

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
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        ...env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      ];
      
      const isAllowed = allowedOrigins.some((allowed) => {
        if (origin === allowed) return true;
        try {
          const allowedHost = new URL(allowed).host;
          const originHost = new URL(origin).host;
          return originHost === allowedHost || originHost.endsWith('.' + allowedHost);
        } catch {
          return false;
        }
      });
      
      if (isAllowed || env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        logger.warn({ origin, allowedOrigins }, 'CORS request blocked');
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

import path from 'path';

// Serve uploaded files statically.
//
// Nama berkasnya UUID acak dan tidak pernah ditimpa — sekali sebuah URL
// terbit, isinya di URL itu tetap sama selamanya. Karena itu keduanya
// disajikan sebagai aset abadi (immutable) berumur satu tahun.
//
// Sebelumnya express.static dan res.sendFile sama-sama memakai bawaan
// `Cache-Control: public, max-age=0`, yang memaksa peramban memvalidasi ulang
// SETIAP foto pada SETIAP kali halaman dibuka. Satu lot berisi tujuh foto,
// satu katalog berisi puluhan lot — jadi ratusan permintaan bersyarat per
// muat halaman, per bidder. Saat ruang lelang ramai (server satu inti, plus
// soket dan bid berjalan bersamaan), sebagian permintaan itu mengantre lalu
// gagal, dan fotonya putus di layar sebagian peserta — sementara peserta lain
// yang cache-nya sudah terisi tetap melihatnya. `immutable` menghapus
// revalidasi itu sepenuhnya setelah muat pertama.
const CACHE_ASET_ABADI = { maxAge: '365d', immutable: true };

app.use('/uploads', express.static('uploads', CACHE_ASET_ABADI));
app.get('/api/uploads/*', (req, res) => {
  const file = (req.params as any)[0];
  res.sendFile(path.resolve(process.cwd(), 'uploads', file), CACHE_ASET_ABADI);
});

const apiPrefix = env.API_PREFIX || '/api/v1';

// Auction data — prices, bids, lot status, deposits — must never be served from
// a cache. Express only sets an ETag by default and no Cache-Control at all,
// which leaves browsers and mobile-carrier proxies free to reuse a response.
// Registered after the /uploads handlers above so asset photos stay cacheable.
app.use(apiPrefix, (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

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
app.use(apiPrefix, niplRoutes);
app.use(apiPrefix, campaignRoutes);
app.use(apiPrefix, dashboardRoutes);
app.use(apiPrefix, contactMessagesRoutes);
app.use(`${apiPrefix}/checkout`, checkoutRoutes);
app.use(apiPrefix, bidderRoutes);
app.use(apiPrefix, providerRoutes);
app.use(apiPrefix, referralRoutes);
app.use(`${apiPrefix}/galleries`, galleryRoutes);

// Routes mounted with specific resource prefixes
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/upload`, uploadRoutes);
app.use(`${apiPrefix}/test`, testRoutes);
app.use(`${apiPrefix}/public`, publicRoutes);
app.use(`${apiPrefix}/health`, healthRoutes);

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
