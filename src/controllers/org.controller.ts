import { Request, Response } from 'express';
import { orgService } from '../services/org.service';

export class OrganizationController {
  
  async create(req: Request, res: Response) {
    const userId = (req as any).user.userId;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Organization name is required' });
    }

    const org = await orgService.createOrganization(userId, name);
    res.status(201).json({ status: 'success', data: org });
  }

  async list(req: Request, res: Response) {
    const userId = (req as any).user.userId;
    const orgs = await orgService.getUserOrganizations(userId);
    res.status(200).json({ status: 'success', data: orgs });
  }

  async getMembers(req: Request, res: Response) {
    // Requires requireOrganization middleware
    const orgId = req.organization!.id;
    const members = await orgService.getOrganizationMembers(orgId);
    res.status(200).json({ status: 'success', data: members });
  }

  async addMember(req: Request, res: Response) {
    // Requires requireOrganization and requireRole(['OWNER', 'ADMIN'])
    const orgId = req.organization!.id;
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ status: 'error', message: 'Email and role are required' });
    }

    const result = await orgService.addMember(orgId, email, role);
    res.status(201).json({ status: 'success', data: result });
  }
}

export const orgController = new OrganizationController();
