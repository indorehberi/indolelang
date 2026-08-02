import app from './app';
import { env } from './config/env';
import { connectRedis, redis } from './config/redis';
import { prisma } from './config/database';
import { logger } from './lib/logger';
import { initSocket } from './lib/socket';
import { initCronJobs } from './lib/cron';
import { createServer } from 'http';

async function startServer() {
  try {
    // 1. Connect to Redis (Warning: skips blocking if connection fails in dev)
    try {
      await connectRedis();
    } catch (err) {
      logger.warn('Failed to connect to Redis on startup. Some features (rate limiter) will be bypassed.');
    }

    // 2. Start HTTP server and bind Socket.io
    const httpServer = createServer(app);
    initSocket(httpServer);

    // Initialize Cron Jobs
    initCronJobs();

    const server = httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // 3. Setup graceful shutdown
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          if (redis.isOpen) {
            await redis.quit();
            logger.info('Redis connection closed.');
          }
          await prisma.$disconnect();
          logger.info('Database connection closed.');
          process.exit(0);
        } catch (error) {
          logger.error({ error }, 'Error during graceful shutdown');
          process.exit(1);
        }
      });

      // Force shutdown after 10s if graceful close hangs
      setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing termination.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    // Sejak Node 15, sebuah promise yang gagal tanpa penangan MENGAKHIRI
    // proses. Untuk server biasa itu wajar — permintaan berikutnya bisa
    // dicoba ulang. Di sini tidak: hitung mundur lot dan seluruh keadaan
    // lelang hidup di memori proses ini, jadi satu kegagalan sepele di sudut
    // mana pun akan mematikan lelang yang sedang berjalan, dan Docker akan
    // menyalakan ulang proses yang sudah kehilangan semua keadaannya.
    //
    // Dicatat sejelas mungkin lalu proses DIBIARKAN HIDUP. Lelang yang masih
    // berjalan dengan satu kesalahan tercatat jauh lebih baik daripada lelang
    // yang mati diam-diam di tengah penawaran.
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(
        { reason, promise: String(promise) },
        'PROMISE GAGAL TANPA PENANGAN — proses sengaja dibiarkan hidup agar lelang yang sedang berjalan tidak ikut mati. Segera periksa penyebabnya.'
      );
    });

    process.on('uncaughtException', (err) => {
      logger.error(
        { err },
        'KESALAHAN TIDAK TERTANGKAP — proses sengaja dibiarkan hidup agar lelang yang sedang berjalan tidak ikut mati. Segera periksa penyebabnya.'
      );
    });
  } catch (error) {
    logger.error({ error }, 'Fatal error on server startup');
    process.exit(1);
  }
}

startServer();
