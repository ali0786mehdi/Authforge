import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';
import { redis } from '../utils/redis';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized: Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted in Redis
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new ApiError(401, 'Unauthorized: Token has been revoked');
    }

    const payload = verifyAccessToken(token);
    
    // Attach user payload to request
    (req as any).user = payload;
    
    next();
  } catch (error: any) {
    next(new ApiError(401, error.message || 'Unauthorized: Invalid token'));
  }
};
