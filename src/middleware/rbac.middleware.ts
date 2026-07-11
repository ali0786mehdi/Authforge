import { Request, Response, NextFunction } from 'express';
import { orgRepository } from '../repositories/org.repository';
import { Role } from '@prisma/client';

// Extend Express Request to include organization context
declare global {
  namespace Express {
    interface Request {
      organization?: {
        id: string;
        role: Role;
      };
    }
  }
}

export const requireOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.header('X-Organization-Id');
    if (!orgId) {
      return res.status(400).json({ status: 'error', message: 'X-Organization-Id header is missing' });
    }

    const user = (req as any).user;
    if (!user || !user.userId) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const membership = await orgRepository.getMember(user.userId, orgId);
    if (!membership) {
      return res.status(403).json({ status: 'error', message: 'You are not a member of this organization' });
    }

    req.organization = {
      id: membership.organizationId,
      role: membership.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const org = req.organization;
    if (!org) {
      return res.status(500).json({ status: 'error', message: 'Organization context missing. Use requireOrganization first.' });
    }

    if (!allowedRoles.includes(org.role)) {
      return res.status(403).json({ 
        status: 'error', 
        message: `Forbidden: requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};
