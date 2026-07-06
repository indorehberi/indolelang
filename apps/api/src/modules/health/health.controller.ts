import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { sendSuccess, sendError } from '../../lib/apiResponse';

export class HealthController {
  async checkHealth(req: Request, res: Response) {
    let dbStatus = 'disconnected';
    let redisStatus = 'disconnected';
    let isHealthy = true;

    // Check Database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (error) {
      isHealthy = false;
      dbStatus = 'error';
    }

    // Check Redis connection
    try {
      if (redis.isOpen) {
        await redis.ping();
        redisStatus = 'connected';
      } else {
        redisStatus = 'disconnected';
      }
    } catch (error) {
      isHealthy = false;
      redisStatus = 'error';
    }

    const payload = {
      status: isHealthy ? 'ok' : 'error',
      database: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    if (isHealthy) {
      return sendSuccess(res, {
        data: payload,
        message: 'System is healthy',
      });
    } else {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SYSTEM_UNHEALTHY',
          message: 'Layanan terdeteksi mengalami kendala',
          details: payload,
        },
      });
    }
  }
}
