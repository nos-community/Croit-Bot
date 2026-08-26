import { prisma } from "../database/prisma.js";
import { gradeUpdateRequestRepository } from "../repositories/grade-update-request.repository.js";
import crypto from "node:crypto";

export async function createGradeUpdateRequest(discordId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const req = await gradeUpdateRequestRepository.create(token, discordId, expiresAt);

  return req;
}

export async function findGradeUpdateRequestByToken(token: string) {
  return gradeUpdateRequestRepository.findByToken(token);
}

export async function completeGradeUpdateRequest(id: string) {
  return gradeUpdateRequestRepository.complete(id);
}
