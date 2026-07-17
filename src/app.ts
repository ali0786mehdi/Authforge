import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger';
import { authRoutes } from './routes/auth.routes';
import { oauthRoutes } from './routes/oauth.routes';
import { mfaRoutes } from './routes/mfa.routes';
import { orgRoutes } from './routes/org.routes';
import { emailVerificationRoutes } from './routes/email-verification.routes';
import { passwordResetRoutes } from './routes/password-reset.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));

// General API Rate Limiter
app.use(apiLimiter);

// Parsing Middlewares
app.use(express.json());
app.use(cookieParser());

// Logging Middleware
app.use(pinoHttp({ logger }));

// Routes
app.use('/auth', authRoutes);
app.use('/auth/oauth', oauthRoutes);
app.use('/auth/mfa', mfaRoutes);
app.use('/auth', emailVerificationRoutes);
app.use('/auth', passwordResetRoutes);
app.use('/orgs', orgRoutes);

// Global Error Handler
app.use(errorMiddleware);

export default app;

