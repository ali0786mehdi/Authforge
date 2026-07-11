import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';
import { redis } from './utils/redis';

const startServer = async () => {
  try {
    // Check connections before starting
    await prisma.$connect();
    logger.info('🟢 Connected to PostgreSQL via Prisma');
    
    // Redis connection is event-driven but we can ping it
    await redis.ping();

    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('🔴 Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
