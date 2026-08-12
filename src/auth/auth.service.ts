import crypto from "node:crypto";
import { prisma } from "../database/prisma.js";

const AUTH_REQUEST_EXPIRES_IN_MS = 10 * 60 * 1000;

export async function createAuthenticationRequest(discordId: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AUTH_REQUEST_EXPIRES_IN_MS);

  await prisma.user.upsert({
    where: {
      discordId,
    },
    create: {
      discordId,
      status: "ACTIVE",
    },
    update: {},
  });

  const token = crypto.randomBytes(32).toString("hex");

  const authRequest = await prisma.authRequest.create({
    data: {
      token,
      discordId,
      expiresAt,
    },
  });

  return authRequest;
}