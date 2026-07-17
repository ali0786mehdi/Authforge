import { prisma } from '../utils/prisma';
import { PasswordResetToken, Prisma } from '@prisma/client';

export class PasswordResetTokenRepository {
  async create(data: Prisma.PasswordResetTokenUncheckedCreateInput): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({ data });
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({ where: { token } });
  }

  async markUsed(id: string): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { id },
      data: { isUsed: true },
    });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
  }
}

export const passwordResetTokenRepository = new PasswordResetTokenRepository();
