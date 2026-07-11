import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { hashPassword, verifyPassword } from '../utils/hash';
import { ApiError } from '../utils/ApiError';

export class AuthController {
  async register(req: Request, res: Response) {
    const user = await authService.register(req.body);
    res.status(201).json({ status: 'success', data: user });
  }

  async login(req: Request, res: Response) {
    const clientInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const { user, accessToken, refreshToken } = await authService.login(req.body, clientInfo);

    // Set HTTP Only Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({ status: 'success', data: { user, accessToken } });
  }

  async logout(req: Request, res: Response) {
    const { userId, sessionId } = (req as any).user;
    const authHeader = req.headers.authorization as string;
    const accessToken = authHeader.split(' ')[1];

    await authService.logout(userId, sessionId, accessToken);

    res.clearCookie('refreshToken');
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ApiError(401, 'No refresh token provided');
    }

    const clientInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken, clientInfo);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ status: 'success', data: { accessToken } });
  }

  async getProfile(req: Request, res: Response) {
    const { userId } = (req as any).user;
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, mfaSecret, ...safeUser } = user;
    res.status(200).json({ status: 'success', data: safeUser });
  }

  async updateProfile(req: Request, res: Response) {
    const { userId } = (req as any).user;
    const user = await userRepository.update(userId, req.body);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, mfaSecret, ...safeUser } = user;
    res.status(200).json({ status: 'success', data: safeUser });
  }

  async changePassword(req: Request, res: Response) {
    const { userId } = (req as any).user;
    const { currentPassword, newPassword } = req.body;

    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) throw new ApiError(400, 'Invalid current password');

    const newPasswordHash = await hashPassword(newPassword);
    await userRepository.update(userId, { passwordHash: newPasswordHash });

    res.status(200).json({ status: 'success', message: 'Password updated successfully' });
  }

  async deleteAccount(req: Request, res: Response) {
    const { userId } = (req as any).user;
    await userRepository.delete(userId);
    res.clearCookie('refreshToken');
    res.status(200).json({ status: 'success', message: 'Account deleted successfully' });
  }
}

export const authController = new AuthController();
