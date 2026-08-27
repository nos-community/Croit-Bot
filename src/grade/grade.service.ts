import { prisma } from "../database/prisma.js";
import crypto from "node:crypto";

export function calculateGrades(musicData: any[]) {
  const basicGrades: number[] = [];
  const recitalGrades: number[] = [];

  for (const song of musicData) {
    if (!song.sheet) continue;
    for (const sheet of song.sheet) {
      if (sheet.grade_basic) basicGrades.push(Number(sheet.grade_basic));
      if (sheet.grade_recital) recitalGrades.push(Number(sheet.grade_recital));
    }
  }

  const basicSum = basicGrades
    .sort((a, b) => b - a)
    .slice(0, 50)
    .reduce((acc, val) => acc + val, 0);

  const recitalSum = recitalGrades
    .sort((a, b) => b - a)
    .slice(0, 50)
    .reduce((acc, val) => acc + val, 0);

  return { basicSum, recitalSum };
}

export async function createGradeUpdateRequest(discordId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  return await prisma.gradeUpdateRequest.create({
    data: {
      discordId,
      token,
      expiresAt,
    },
  });
}

export async function findGradeUpdateRequestByToken(token: string) {
  return await prisma.gradeUpdateRequest.findUnique({
    where: { token },
  });
}

export async function completeGradeUpdateRequest(id: string) {
  return await prisma.gradeUpdateRequest.update({
    where: { id },
    data: {
      completedAt: new Date(),
    },
  });
}