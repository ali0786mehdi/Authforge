import { userRepository } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { hashPassword, verifyPassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateMfaToken, verifyMfaToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { redis } from '../utils/redis';
import crypto from 'crypto';
import authenticator from 'otplib'; // otplib might import differently depending on default export

export class AuthService {
  async register(data: any) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const user = await userRepository.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async login(data: any, clientInfo: any) {
    const user = await userRepository.findByEmail(data.email);
    if (!user || !user.passwordHash) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isPasswordValid = await verifyPassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Handle MFA
    if (user.mfaEnabled) {
      const jti = crypto.randomUUID();
      const mfaToken = generateMfaToken({ userId: user.id }, jti);
      return { mfaRequired: true, mfaToken };
    }

    return this.createFullSession(user, clientInfo);
  }

  async mfaLogin(mfaToken: string, code: string, clientInfo: any) {
    const payload = verifyMfaToken(mfaToken);

    // 1. Check if token is blacklisted (Single-Use enforcement)
    const isBlacklisted = await redis.get(`blacklist:${payload.jti}`);
    if (isBlacklisted) {
      throw new ApiError(401, 'MFA Token has already been used');
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new ApiError(400, 'Invalid MFA state');
    }

    // 2. Verify TOTP code using otplib
    const authenticatorObj = require('otplib').authenticator;
    const isValid = authenticatorObj.verify({ token: code, secret: user.mfaSecret });

    if (!isValid) {
      throw new ApiError(401, 'Invalid MFA code');
    }

    // 3. Blacklist the jti so it cannot be reused
    await redis.setex(`blacklist:${payload.jti}`, 5 * 60, 'true');

    // 4. Issue full session
    return this.createFullSession(user, clientInfo);
  }

  private async createFullSession(user: any, clientInfo: any) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await sessionRepository.create({
      userId: user.id,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      expiresAt,
    });

    const accessToken = generateAccessToken({ userId: user.id, sessionId: session.id });
    const refreshToken = generateRefreshToken({ userId: user.id, sessionId: session.id });

    return {
      mfaRequired: false,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string, sessionId: string, accessToken: string) {
    await sessionRepository.revoke(sessionId);
    await redis.setex(`blacklist:${accessToken}`, 15 * 60, 'true');
  }

  async refresh(token: string, clientInfo: any) {
    const payload = verifyRefreshToken(token);

    const session = await sessionRepository.findById(payload.sessionId);
    if (!session) {
      throw new ApiError(401, 'Session not found');
    }

    if (session.isRevoked) {
      await sessionRepository.revokeAllForUser(payload.userId);
      throw new ApiError(401, 'Session has been revoked due to suspicious activity');
    }

    if (new Date() > session.expiresAt) {
      throw new ApiError(401, 'Session expired');
    }

    await sessionRepository.revoke(session.id);

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const newSession = await sessionRepository.create({
      userId: payload.userId,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      expiresAt: newExpiresAt,
    });

    const newAccessToken = generateAccessToken({ userId: payload.userId, sessionId: newSession.id });
    const newRefreshToken = generateRefreshToken({ userId: payload.userId, sessionId: newSession.id });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

export const authService = new AuthService();
