import { Router } from 'express';
import { emailVerificationController } from '../controllers/email-verification.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { sensitiveEndpointLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public Routes
router.post('/verify-email', asyncHandler(emailVerificationController.verify));
router.post('/resend-verification', sensitiveEndpointLimiter, asyncHandler(emailVerificationController.resend));

export const emailVerificationRoutes = router;
