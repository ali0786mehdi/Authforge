import { Request, Response } from 'express';
import { emailVerificationService } from '../services/email-verification.service';

export class EmailVerificationController {
  async verify(req: Request, res: Response) {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Verification token is required' });
    }

    const result = await emailVerificationService.verifyEmail(token);
    res.status(200).json({ status: 'success', data: result });
  }

  async resend(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email address is required' });
    }

    const result = await emailVerificationService.resendVerification(email);
    res.status(200).json({ status: 'success', data: result });
  }
}

export const emailVerificationController = new EmailVerificationController();
