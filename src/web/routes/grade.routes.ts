import { Router } from "express";
import { z } from "zod";

import {
  findGradeUpdateRequestByToken,
  completeGradeUpdateRequest,
} from "../../grade/grade.service.js";
import { prisma } from "../../database/prisma.js";
import { discordClient } from "../../bot/client.js";
import { env } from "../../config/env.js";

const router = Router();

const musicSheetSchema = z
  .object({
    grade_basic: z.number().optional(),
    grade_recital: z.number().optional(),
  })
  .passthrough();

const musicEntrySchema = z
  .object({
    sheet: z.array(musicSheetSchema).optional(),
  })
  .passthrough();

const completeSchema = z.object({
  token: z.string(),
  musicData: z.array(musicEntrySchema),
});

function computeGradeTotal(musicData: z.infer<typeof musicEntrySchema>[]) {
  const basicGrades: number[] = [];
  const recitalGrades: number[] = [];

  for (const music of musicData) {
    for (const sheet of music.sheet ?? []) {
      if (typeof sheet.grade_basic === "number" && sheet.grade_basic > 0) {
        basicGrades.push(sheet.grade_basic);
      }
      if (typeof sheet.grade_recital === "number" && sheet.grade_recital > 0) {
        recitalGrades.push(sheet.grade_recital);
      }
    }
  }

  basicGrades.sort((a, b) => b - a);
  recitalGrades.sort((a, b) => b - a);

  const basicSum = basicGrades.slice(0, 50).reduce((sum, v) => sum + v, 0);
  const recitalSum = recitalGrades.slice(0, 50).reduce((sum, v) => sum + v, 0);

  return {
    basicSum,
    recitalSum,
    total: basicSum + recitalSum,
  };
}

router.post("/complete", async (req, res) => {
  const parsed = completeSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ success: false, message: "잘못된 요청입니다." });
    return;
  }

  const { token, musicData } = parsed.data;

  const gradeRequest = await findGradeUpdateRequestByToken(token);

  if (!gradeRequest) {
    res.status(404).json({ success: false, message: "유효하지 않은 토큰입니다." });
    return;
  }

  if (gradeRequest.completedAt) {
    res.status(400).json({ success: false, message: "이미 처리된 요청입니다." });
    return;
  }

  if (gradeRequest.expiresAt <= new Date()) {
    res.status(410).json({ success: false, message: "요청이 만료되었습니다." });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { discordId: gradeRequest.discordId },
  });

  if (!user?.baseNickname) {
    res
      .status(400)
      .json({
        success: false,
        message: "인증 정보가 올바르지 않습니다. /auth를 먼저 진행해주세요.",
      });
    return;
  }

  const { basicSum, recitalSum, total } = computeGradeTotal(musicData);

  console.log(
    `[grade.routes] discordId=${gradeRequest.discordId} basicSum=${basicSum} recitalSum=${recitalSum} total=${total}`,
  );

  const newNickname = env.VERIFIED_NICKNAME_FORMAT.replace("{current}", user.baseNickname)
    .replace("{그레이드}", String(total))
    .slice(0, 32);

  try {
    const guild = discordClient.guilds.cache.get(env.DISCORD_GUILD_ID);
    const member = await guild?.members.fetch(gradeRequest.discordId);
    await member?.setNickname(newNickname);
  } catch (err) {
    console.error("[grade.routes] 닉네임 변경 실패:", err);
  }

  await completeGradeUpdateRequest(gradeRequest.id);

  await prisma.user.update({
    where: { discordId: gradeRequest.discordId },
    data: { currentGrade: total, lastGradeUpdateAt: new Date() },
  });

  res.json({ success: true, nickname: newNickname, gradeTotal: total, basicSum, recitalSum });
});

export { router as gradeRouter };