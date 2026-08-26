import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../database/prisma.js";
import { authRequestRepository } from "../../auth/repositories/auth-request.repository.js";
import { createAuthSessionToken } from "../../auth/auth-session.js";
import { discordClient } from "../../bot/client.js";
import { env } from "../../config/env.js";

const router = Router();

const completeAuthSchema = z.object({
  token: z.string().min(1, "인증 토큰이 필요합니다."),
  snsid: z.string().min(1, "e-amusement 사용자 식별자가 필요합니다."),
  // `sessionCookie`는 확장에서 전송되지 않을 수 있으므로 선택 항목으로 둡니다.
  sessionCookie: z.string().optional(),
});

router.post("/complete", async (req, res) => {
  const parsed = completeAuthSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "인증 요청 정보가 올바르지 않습니다.",
      errors: parsed.error.flatten().fieldErrors,
    });

    return;
  }

  const { token, snsid } = parsed.data;

  try {
    const authRequest = await authRequestRepository.findByToken(token);

    if (!authRequest) {
      res.status(404).json({
        success: false,
        message: "존재하지 않는 인증 요청입니다.",
      });

      return;
    }

    const now = new Date();

    if (authRequest.expiresAt <= now) {
      res.status(410).json({
        success: false,
        message: "인증 요청이 만료되었습니다. Discord에서 다시 인증해주세요.",
      });

      return;
    }

    if (authRequest.completedAt) {
      res.status(409).json({
        success: false,
        message: "이미 완료된 인증 요청입니다.",
      });

      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        discordId: authRequest.discordId,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Discord 사용자 정보를 찾을 수 없습니다.",
      });

      return;
    }

    const sessionToken = createAuthSessionToken();

    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          eamusementId: snsid,
        },
      });

      await tx.authRequest.update({
        where: {
          id: authRequest.id,
        },
        data: {
          completedAt: now,
        },
      });

      await tx.authSession.create({
        data: {
          authRequestId: authRequest.id,
          discordId: authRequest.discordId,
          sessionToken,
          createdAt: now,
          expiresAt: authRequest.expiresAt,
        },
      });
    });

    // 역할 부여 시도: 실패해도 인증 자체는 성공으로 처리합니다.
    try {
      if (env.VERIFIED_ROLE_ID) {
        const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
        const member = await guild.members.fetch(authRequest.discordId);

        await member.roles.add(env.VERIFIED_ROLE_ID);

        console.log(
          `역할 부여 성공: Discord ID=${authRequest.discordId} -> role=${env.VERIFIED_ROLE_ID}`,
        );
      } else {
        console.warn("VERIFIED_ROLE_ID가 설정되지 않아 역할 부여를 건너뜁니다.");
      }
    } catch (roleError: unknown) {
      console.error("역할 부여 중 오류가 발생했습니다. 인증은 완료되었습니다.", roleError);
    }

    console.log(`e-amusement 인증이 완료되었습니다. Discord ID: ${authRequest.discordId}`);

    res.status(200).json({
      success: true,
      message: "e-amusement 인증이 완료되었습니다.",
      sessionToken,
    });
  } catch (error: unknown) {
    console.error("e-amusement 인증 완료 처리 중 오류가 발생했습니다.", error);

    res.status(500).json({
      success: false,
      message: "인증 처리 중 오류가 발생했습니다.",
    });
  }
});

export { router as authRouter };
