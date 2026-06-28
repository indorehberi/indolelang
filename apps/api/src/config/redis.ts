import { createClient } from 'redis';
import { env } from './env';
import { logger } from '../lib/logger';

export const redis = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        logger.warn('Redis reconnection stopped. Running in no-redis mode (rate limiting and real OTP verification will be bypassed).');
        return false; // Stop attempting to reconnect
      }
      return 5000; // Retry after 5 seconds
    }
  }
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis Client Error');
});

redis.on('connect', () => {
  logger.info('Redis Client Connected');
});

export const connectRedis = async () => {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Redis');
    throw error;
  }
};

export default redis;
