import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// Public Routes
router.post('/register', validateRequest(registerSchema), asyncHandler(authController.register));
router.post('/login', validateRequest(loginSchema), asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));

// Protected Routes
router.use(authenticate);
router.post('/logout', asyncHandler(authController.logout));
router.get('/profile', asyncHandler(authController.getProfile));
router.patch('/profile', validateRequest(updateProfileSchema), asyncHandler(authController.updateProfile));
router.patch('/password', validateRequest(changePasswordSchema), asyncHandler(authController.changePassword));
router.delete('/account', asyncHandler(authController.deleteAccount));

export const authRoutes = router;
