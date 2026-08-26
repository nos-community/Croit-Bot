import { Router } from "express";
import { z } from "zod";
import {
  findGradeUpdateRequestByToken,
  completeGradeUpdateRequest,
} from "../../grade/grade.service.js";
import { prisma } from "../../database/prisma.js";
import { env } from "../../config/env.js";
import { discordClient } from "../../bot/client.js";
import { formatNickname } from "../../utils/nickname.js";
import { PermissionFlagsBits } from "discord.js";

const router = Router();

const completeSchema = z.object({
  token: z.string().min(1),
  gradeSum: z.number().int().nonnegative(),
});

router.post("/complete", async (req, res) => {
  const parsed = completeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "invalid" });

  const { token, gradeSum } = parsed.data;

  const reqRec = await findGradeUpdateRequestByToken(token);
  if (!reqRec) return res.status(404).json({ success: false, message: "존재하지 않는 요청" });

  if (reqRec.expiresAt <= new Date())
    return res.status(410).json({ success: false, message: "요청 만료" });

  if (reqRec.completedAt)
    return res.status(409).json({ success: false, message: "이미 완료된 요청" });

  const user = await prisma.user.findUnique({ where: { discordId: reqRec.discordId } });
  if (!user) return res.status(404).json({ success: false, message: "사용자 없음" });

  // cooldown check (5 minutes)
  const now = new Date();
  const lastUpdate = (user as any).lastGradeUpdateAt as string | Date | undefined;
  if (lastUpdate && now.getTime() - new Date(lastUpdate).getTime() < 5 * 60 * 1000) {
    return res.status(429).json({ success: false, message: "짧은 시간 내 재요청은 불가합니다." });
  }

  try {
    const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
    const member = await guild.members.fetch(reqRec.discordId);

    const botId = discordClient.user?.id;
    if (!botId) return res.status(500).json({ success: false, message: "봇 정보 없음" });

    const botMember = await guild.members.fetch(botId);

    if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      console.warn("봇에 ManageNicknames 권한이 없습니다.");
      // Still proceed to store grade in DB but do not change nickname
    }

    const baseForUse = (user as any).baseNickname ?? member.displayName;
    const newNick = formatNickname(baseForUse, gradeSum);

    // Try to set nickname if possible
    if (botMember.permissions.has(PermissionFlagsBits.ManageNicknames) && member.manageable) {
      await member.setNickname(newNick);
    } else {
      console.warn("닉네임 변경 권한/위계 부족으로 닉네임을 변경하지 않습니다.");
    }

    // update DB
    await prisma.user.update({
      where: { id: user.id },
      data: { currentGrade: gradeSum, lastGradeUpdateAt: now },
    });

    await completeGradeUpdateRequest(reqRec.id);

    return res.json({ success: true, message: "업데이트 성공" });
  } catch (error) {
    console.error("/api/grade/complete 처리 중 오류:", error);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

export { router as gradeRouter };
