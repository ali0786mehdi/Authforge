import crypto from 'crypto';
import { userRepository } from '../repositories/user.repository';
import { passwordResetTokenRepository } from '../repositories/password-reset-token.repository';
import { sendPasswordResetEmail } from '../utils/email';
import { hashPassword } from '../utils/hash';
import { ApiError } from '../utils/ApiError';

export class PasswordResetService {
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(email);

    // Don't reveal whether user exists (security best practice)
    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Delete any existing reset tokens for this user
    await passwordResetTokenRepository.deleteAllForUser(user.id);

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await passwordResetTokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    await sendPasswordResetEmail(user.email, token);

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const resetToken = await passwordResetTokenRepository.findByToken(token);

    if (!resetToken) {
      throw new ApiError(400, 'Invalid or expired reset link');
    }

    if (resetToken.isUsed) {
      throw new ApiError(400, 'This reset link has already been used');
    }

    if (new Date() > resetToken.expiresAt) {
      await passwordResetTokenRepository.deleteAllForUser(resetToken.userId);
      throw new ApiError(400, 'Reset link has expired. Please request a new one.');
    }

    // Hash new password and update user
    const passwordHash = await hashPassword(newPassword);
    await userRepository.update(resetToken.userId, { passwordHash });

    // Mark token as used and clean up
    await passwordResetTokenRepository.markUsed(resetToken.id);
    await passwordResetTokenRepository.deleteAllForUser(resetToken.userId);

    return { message: 'Password reset successfully. You can now log in with your new password.' };
  }
}

export const passwordResetService = new PasswordResetService();
