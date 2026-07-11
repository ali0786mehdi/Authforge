import { prisma } from '../utils/prisma';
import { OAuthIdentity, Prisma } from '@prisma/client';

export class OAuthRepository {
  async create(data: Prisma.OAuthIdentityUncheckedCreateInput): Promise<OAuthIdentity> {
    return prisma.oAuthIdentity.create({ data });
  }

  async findByProvider(provider: string, providerId: string): Promise<OAuthIdentity | null> {
    return prisma.oAuthIdentity.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
    });
  }
}

export const oauthRepository = new OAuthRepository();
