import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

// Create reusable transporter
const createTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn('⚠️  SMTP not configured. Emails will be logged to console instead of sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT || '587'),
    secure: env.SMTP_PORT === '465',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const from = env.EMAIL_FROM || 'AuthForge <noreply@authforge.dev>';

  if (!transporter) {
    // Fallback: log email to console in development
    logger.info(`📧 [DEV EMAIL] To: ${options.to} | Subject: ${options.subject}`);
    logger.info(`📧 [DEV EMAIL] Body:\n${options.html}`);
    return;
  }

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  logger.info(`📧 Email sent to ${options.to}: ${options.subject}`);
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your email — AuthForge',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">🔐 AuthForge</h1>
        </div>
        <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; text-align: center;">
          <h2 style="color: #1a1a2e; margin-top: 0;">Verify your email address</h2>
          <p style="color: #6b7280; line-height: 1.6;">
            Thanks for signing up! Please click the button below to verify your email address and activate your account.
          </p>
          <a href="${verificationUrl}" 
             style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0;">
            Verify Email
          </a>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 16px; word-break: break-all;">
            Or copy this link: ${verificationUrl}
          </p>
        </div>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your password — AuthForge',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">🔐 AuthForge</h1>
        </div>
        <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; text-align: center;">
          <h2 style="color: #1a1a2e; margin-top: 0;">Reset your password</h2>
          <p style="color: #6b7280; line-height: 1.6;">
            We received a request to reset your password. Click the button below to choose a new password.
          </p>
          <a href="${resetUrl}" 
             style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 16px; word-break: break-all;">
            Or copy this link: ${resetUrl}
          </p>
        </div>
      </div>
    `,
  });
};
