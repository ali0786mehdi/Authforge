import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  logger.info('🟢 Connected to Redis');
});

redis.on('error', (err) => {
  logger.error('🔴 Redis connection error:', err);
});
