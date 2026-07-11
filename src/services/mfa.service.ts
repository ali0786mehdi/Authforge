import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';

export class MfaService {
  async setupMfa(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    if (user.mfaEnabled) {
      throw new ApiError(400, 'MFA is already enabled');
    }

    // Generate a secure base32 secret
    const secret = authenticator.generateSecret();
    
    // Create the otpauth URI for the authenticator app
    const otpauth = authenticator.keyuri(user.email, 'AuthForge', secret);

    // Save the secret temporarily, but do not enable MFA yet
    await userRepository.update(userId, { mfaSecret: secret });

    // Generate the QR code data URL
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    return { secret, qrCodeUrl };
  }

  async verifyMfaSetup(userId: string, code: string) {
    const user = await userRepository.findById(userId);
    if (!user || !user.mfaSecret) {
      throw new ApiError(400, 'MFA setup not initiated');
    }

    const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });

    if (!isValid) {
      throw new ApiError(400, 'Invalid verification code');
    }

    // Mark MFA as fully enabled
    await userRepository.update(userId, { mfaEnabled: true });

    return { message: 'MFA enabled successfully' };
  }
}

export const mfaService = new MfaService();
