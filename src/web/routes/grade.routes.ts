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

const completeSchema = z.object({
  token: z.string(),
  gradeSum: z.number().int().nonnegative(),
});

router.post("/complete", async (req, res) => {
  const parsed = completeSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ success: false, message: "잘못된 요청입니다." });
    return;
  }

  const { token, gradeSum } = parsed.data;

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

  const newNickname = env.VERIFIED_NICKNAME_FORMAT.replace("{current}", user.baseNickname)
    .replace("{그레이드}", String(gradeSum))
    .slice(0, 32);

  try {
    const guild = discordClient.guilds.cache.get(env.DISCORD_GUILD_ID);
    const member = await guild?.members.fetch(gradeRequest.discordId);
    await member?.setNickname(newNickname);
  } catch (err) {
    console.error("[grade.routes] 닉네임 변경 실패:", err);
    // 닉네임 변경 실패해도 데이터 자체는 완료 처리 (재시도 루프 방지)
  }

  await completeGradeUpdateRequest(gradeRequest.id);

  await prisma.user.update({
    where: { discordId: gradeRequest.discordId },
    data: { currentGrade: gradeSum, lastGradeUpdateAt: new Date() },
  });

  res.json({ success: true, nickname: newNickname });
});

export { router as gradeRouter };