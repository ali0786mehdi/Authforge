import { Router } from 'express';
import { orgController } from '../controllers/org.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireOrganization, requireRole } from '../middleware/rbac.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All organization routes require authentication
router.use(authenticate);

// Global routes (do not require specific org context)
router.post('/', asyncHandler(orgController.create));
router.get('/', asyncHandler(orgController.list));

// Context-aware routes (require X-Organization-Id header)
router.get(
  '/:id/members', 
  requireOrganization, 
  asyncHandler(orgController.getMembers)
);

router.post(
  '/:id/members', 
  requireOrganization, 
  requireRole(['OWNER', 'ADMIN']), 
  asyncHandler(orgController.addMember)
);

export const orgRoutes = router;
