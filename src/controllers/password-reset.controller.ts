import { Request, Response } from 'express';
import { passwordResetService } from '../services/password-reset.service';

export class PasswordResetController {
  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email address is required' });
    }

    const result = await passwordResetService.forgotPassword(email);
    res.status(200).json({ status: 'success', data: result });
  }

  async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters' });
    }

    const result = await passwordResetService.resetPassword(token, newPassword);
    res.status(200).json({ status: 'success', data: result });
  }
}

export const passwordResetController = new PasswordResetController();
