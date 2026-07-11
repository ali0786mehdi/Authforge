import { Router } from 'express';
import { oauthController } from '../controllers/oauth.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/google', oauthController.googleAuth);
router.get('/google/callback', asyncHandler(oauthController.googleCallback));

router.get('/github', oauthController.githubAuth);
router.get('/github/callback', asyncHandler(oauthController.githubCallback));

export const oauthRoutes = router;
