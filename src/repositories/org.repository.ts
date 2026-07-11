import { prisma } from '../utils/prisma';
import { Organization, OrganizationMember, Role } from '@prisma/client';

export class OrganizationRepository {
  async create(name: string, slug: string, ownerId: string): Promise<Organization> {
    return prisma.organization.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId: ownerId,
            role: Role.OWNER,
          },
        },
      },
      include: {
        members: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return prisma.organization.findUnique({ where: { slug } });
  }

  async findById(id: string): Promise<Organization | null> {
    return prisma.organization.findUnique({ where: { id } });
  }

  async getUserOrganizations(userId: string) {
    return prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });
  }

  async getMember(userId: string, organizationId: string): Promise<OrganizationMember | null> {
    return prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }

  async getMembers(organizationId: string) {
    return prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async addMember(organizationId: string, userId: string, role: Role = Role.MEMBER) {
    return prisma.organizationMember.create({
      data: {
        organizationId,
        userId,
        role,
      },
    });
  }
}

export const orgRepository = new OrganizationRepository();
