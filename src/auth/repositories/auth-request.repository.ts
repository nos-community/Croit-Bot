import { prisma } from "../../database/prisma.js";

export const authRequestRepository = {
  async create(discordId: string, token: string, expiresAt: Date) {
    return prisma.authRequest.create({
      data: {
        discordId,
        token,
        expiresAt,
      },
    });
  },

  async findByToken(token: string) {
    return prisma.authRequest.findUnique({
      where: {
        token,
      },
    });
  },

  async complete(id: string) {
    return prisma.authRequest.update({
      where: {
        id,
      },
      data: {
        completedAt: new Date(),
      },
    });
  },

  async deleteExpired() {
    return prisma.authRequest.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  },
};
