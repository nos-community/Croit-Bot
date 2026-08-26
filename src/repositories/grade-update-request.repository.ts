import { prisma } from "../database/prisma.js";

export const gradeUpdateRequestRepository = {
  async create(token: string, discordId: string, expiresAt: Date) {
    return prisma.gradeUpdateRequest.create({
      data: {
        token,
        discordId,
        expiresAt,
      },
    });
  },

  async findByToken(token: string) {
    return prisma.gradeUpdateRequest.findUnique({ where: { token } });
  },

  async complete(id: string) {
    return prisma.gradeUpdateRequest.update({ where: { id }, data: { completedAt: new Date() } });
  },
};
