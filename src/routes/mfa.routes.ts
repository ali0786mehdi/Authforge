import { Router } from 'express';
import { mfaController } from '../controllers/mfa.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Protected Routes (Require standard JWT session)
router.post('/setup', authenticate, asyncHandler(mfaController.setup));
router.post('/verify-setup', authenticate, asyncHandler(mfaController.verifySetup));

// Public Route (Requires temporary mfaToken in body)
router.post('/login', asyncHandler(mfaController.login));

export const mfaRoutes = router;
