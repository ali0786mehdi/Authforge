import { Request, Response } from 'express';
import { mfaService } from '../services/mfa.service';
import { authService } from '../services/auth.service';
import { env } from '../config/env';

export class MfaController {
  
  async setup(req: Request, res: Response) {
    // Requires authenticated user
    const userId = (req as any).user.userId;
    const result = await mfaService.setupMfa(userId);
    res.status(200).json({ status: 'success', data: result });
  }

  async verifySetup(req: Request, res: Response) {
    // Requires authenticated user
    const userId = (req as any).user.userId;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ status: 'error', message: 'MFA Code is required' });
    }

    const result = await mfaService.verifyMfaSetup(userId, code);
    res.status(200).json({ status: 'success', data: result });
  }

  async login(req: Request, res: Response) {
    // Public endpoint, but requires the temporary mfaToken and the TOTP code
    const { mfaToken, code } = req.body;

    if (!mfaToken || !code) {
      return res.status(400).json({ status: 'error', message: 'mfaToken and code are required' });
    }

    const clientInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

    const result = await authService.mfaLogin(mfaToken, code, clientInfo);

    // Set the refresh token inside an HttpOnly Cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }
}

export const mfaController = new MfaController();
