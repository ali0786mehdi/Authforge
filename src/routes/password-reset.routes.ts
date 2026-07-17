import { Router } from 'express';
import { passwordResetController } from '../controllers/password-reset.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { sensitiveEndpointLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public Routes — both rate-limited
router.post('/forgot-password', sensitiveEndpointLimiter, asyncHandler(passwordResetController.forgotPassword));
router.post('/reset-password', sensitiveEndpointLimiter, asyncHandler(passwordResetController.resetPassword));

export const passwordResetRoutes = router;
