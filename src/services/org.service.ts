import { orgRepository } from '../repositories/org.repository';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';
import { Role } from '@prisma/client';

export class OrganizationService {
  async createOrganization(userId: string, name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Ensure slug is unique
    const existing = await orgRepository.findBySlug(slug);
    if (existing) {
      throw new ApiError(400, 'Organization with this name/slug already exists');
    }

    const org = await orgRepository.create(name, slug, userId);
    return org;
  }

  async getUserOrganizations(userId: string) {
    const memberships = await orgRepository.getUserOrganizations(userId);
    return memberships.map(m => ({
      ...m.organization,
      role: m.role,
    }));
  }

  async getOrganizationMembers(organizationId: string) {
    const members = await orgRepository.getMembers(organizationId);
    return members.map(m => ({
      id: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  async addMember(organizationId: string, email: string, role: Role) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(404, 'User with this email not found. They must register first.');
    }

    const existingMember = await orgRepository.getMember(user.id, organizationId);
    if (existingMember) {
      throw new ApiError(400, 'User is already a member of this organization');
    }

    await orgRepository.addMember(organizationId, user.id, role);
    return { message: 'Member added successfully' };
  }
}

export const orgService = new OrganizationService();
