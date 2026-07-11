import { Request, Response } from 'express';
import { oauthService } from '../services/oauth.service';
import { env } from '../config/env';

export class OAuthController {
  
  // Initiate Google Auth
  googleAuth(req: Request, res: Response) {
    const url = oauthService.getGoogleAuthUrl();
    res.redirect(url);
  }

  // Handle Google Callback
  async googleCallback(req: Request, res: Response) {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.redirect(`${env.FRONTEND_URL}/login?error=Invalid+Google+Code`);
    }

    const clientInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

    try {
      const { refreshToken } = await oauthService.handleGoogleCallback(code, clientInfo);

      // Set HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Redirect to frontend dashboard. The frontend API client interceptor will fetch the access token via `/refresh`
      res.redirect(`${env.FRONTEND_URL}/dashboard`);
    } catch (error) {
      console.error(error);
      res.redirect(`${env.FRONTEND_URL}/login?error=Google+Auth+Failed`);
    }
  }

  // Initiate GitHub Auth
  githubAuth(req: Request, res: Response) {
    const url = oauthService.getGithubAuthUrl();
    res.redirect(url);
  }

  // Handle GitHub Callback
  async githubCallback(req: Request, res: Response) {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.redirect(`${env.FRONTEND_URL}/login?error=Invalid+GitHub+Code`);
    }

    const clientInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };

    try {
      const { refreshToken } = await oauthService.handleGithubCallback(code, clientInfo);

      // Set HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(`${env.FRONTEND_URL}/dashboard`);
    } catch (error) {
      console.error(error);
      res.redirect(`${env.FRONTEND_URL}/login?error=GitHub+Auth+Failed`);
    }
  }
}

export const oauthController = new OAuthController();
