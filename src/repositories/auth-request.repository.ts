import { prisma } from "../database/prisma.js";

export async function createAuthRequest(discordId: string, token: string, expiresAt: Date) {
  return prisma.authRequest.create({
    data: {
      discordId,
      token,
      expiresAt,
    },
  });
}

export async function findAuthRequestByToken(token: string) {
  return prisma.authRequest.findUnique({
    where: {
      token,
    },
  });
}

export async function completeAuthRequest(id: string) {
  return prisma.authRequest.update({
    where: {
      id,
    },
    data: {
      completedAt: new Date(),
    },
  });
}

export async function deleteExpiredAuthRequests() {
  return prisma.authRequest.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}
