import crypto from 'crypto';
import { userRepository } from '../repositories/user.repository';
import { verificationTokenRepository } from '../repositories/verification-token.repository';
import { sendVerificationEmail } from '../utils/email';
import { ApiError } from '../utils/ApiError';

export class EmailVerificationService {
  async sendVerification(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    if (user.isEmailVerified) {
      throw new ApiError(400, 'Email is already verified');
    }

    // Delete any existing tokens for this user
    await verificationTokenRepository.deleteAllForUser(userId);

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Token expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await verificationTokenRepository.create({
      userId,
      token,
      expiresAt,
    });

    await sendVerificationEmail(user.email, token);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const verificationToken = await verificationTokenRepository.findByToken(token);

    if (!verificationToken) {
      throw new ApiError(400, 'Invalid or expired verification link');
    }

    if (new Date() > verificationToken.expiresAt) {
      await verificationTokenRepository.delete(verificationToken.id);
      throw new ApiError(400, 'Verification link has expired. Please request a new one.');
    }

    // Mark user email as verified
    await userRepository.update(verificationToken.userId, { isEmailVerified: true });

    // Clean up all verification tokens for this user
    await verificationTokenRepository.deleteAllForUser(verificationToken.userId);

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(email);

    // Don't reveal whether user exists (security best practice)
    if (!user) {
      return { message: 'If an account with that email exists, a verification email has been sent.' };
    }

    if (user.isEmailVerified) {
      return { message: 'If an account with that email exists, a verification email has been sent.' };
    }

    await this.sendVerification(user.id);

    return { message: 'If an account with that email exists, a verification email has been sent.' };
  }
}

export const emailVerificationService = new EmailVerificationService();
