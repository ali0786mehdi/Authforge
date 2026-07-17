import { prisma } from '../utils/prisma';
import { VerificationToken, Prisma } from '@prisma/client';

export class VerificationTokenRepository {
  async create(data: Prisma.VerificationTokenUncheckedCreateInput): Promise<VerificationToken> {
    return prisma.verificationToken.create({ data });
  }

  async findByToken(token: string): Promise<VerificationToken | null> {
    return prisma.verificationToken.findUnique({ where: { token } });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await prisma.verificationToken.deleteMany({ where: { userId } });
  }

  async delete(id: string): Promise<void> {
    await prisma.verificationToken.delete({ where: { id } });
  }
}

export const verificationTokenRepository = new VerificationTokenRepository();
