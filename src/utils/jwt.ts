import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  sessionId: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m',
    algorithm: 'HS256',
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};

export interface MfaJwtPayload {
  userId: string;
}

export const generateMfaToken = (payload: MfaJwtPayload, jti: string): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '5m', // Valid for 5 minutes
    algorithm: 'HS256',
    jwtid: jti, // Include JWT ID for single-use tracking
  });
};

export const verifyMfaToken = (token: string): MfaJwtPayload & { jti: string } => {
  return jwt.verify(token, env.JWT_SECRET) as MfaJwtPayload & { jti: string };
};
