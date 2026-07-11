import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { userRepository } from '../repositories/user.repository';
import { oauthRepository } from '../repositories/oauth.repository';
import { sessionRepository } from '../repositories/session.repository';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

export class OAuthService {
  // ------------------ GOOGLE ------------------

  getGoogleAuthUrl(): string {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL) {
      throw new ApiError(500, 'Google OAuth is not configured');
    }
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string, clientInfo: any) {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
      throw new ApiError(500, 'Google OAuth is not configured');
    }

    // 1. Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: env.GOOGLE_CALLBACK_URL,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new ApiError(400, `Failed to exchange Google code: ${error}`);
    }

    const { access_token } = await tokenResponse.json();

    // 2. Fetch user profile
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      throw new ApiError(400, 'Failed to fetch Google profile');
    }

    const profile = await userResponse.json();
    return this.processOAuthLogin('google', profile.id, profile.email, profile.given_name, profile.family_name, clientInfo);
  }

  // ------------------ GITHUB ------------------

  getGithubAuthUrl(): string {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CALLBACK_URL) {
      throw new ApiError(500, 'GitHub OAuth is not configured');
    }
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_CALLBACK_URL,
      scope: 'read:user user:email',
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async handleGithubCallback(code: string, clientInfo: any) {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GITHUB_CALLBACK_URL) {
      throw new ApiError(500, 'GitHub OAuth is not configured');
    }

    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_CALLBACK_URL,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new ApiError(400, `Failed to exchange GitHub code: ${tokenData.error_description}`);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await userResponse.json();

    // 3. Fetch user emails (GitHub primary email might not be in profile)
    let email = profile.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary && e.verified);
      if (!primaryEmail) {
        throw new ApiError(400, 'GitHub account has no verified primary email');
      }
      email = primaryEmail.email;
    }

    const [firstName, lastName] = profile.name ? profile.name.split(' ') : ['', ''];

    return this.processOAuthLogin('github', profile.id.toString(), email, firstName, lastName, clientInfo);
  }

  // ------------------ COMMON LOGIC ------------------

  private async processOAuthLogin(
    provider: string,
    providerId: string,
    email: string,
    firstName: string | undefined,
    lastName: string | undefined,
    clientInfo: any
  ) {
    // Check if identity already exists
    let identity = await oauthRepository.findByProvider(provider, providerId);
    let user;

    if (identity) {
      user = await userRepository.findById(identity.userId);
      if (!user) throw new ApiError(500, 'Linked user account not found');
    } else {
      // Identity doesn't exist. Check if a user with this email exists.
      user = await userRepository.findByEmail(email);

      if (!user) {
        // Create new user (passwordHash is null since they used OAuth)
        user = await userRepository.create({
          email,
          firstName,
          lastName,
          isEmailVerified: true, // Trusted from OAuth provider
        });
      }

      // Link new identity to the user
      identity = await oauthRepository.create({
        userId: user.id,
        provider,
        providerId,
      });
    }

    // Create session and issue tokens
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

    return { accessToken, refreshToken, user };
  }
}

export const oauthService = new OAuthService();
