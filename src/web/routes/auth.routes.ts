import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../database/prisma.js";
import { authRequestRepository } from "../../auth/repositories/auth-request.repository.js";
import { createAuthSessionToken } from "../../auth/auth-session.js";

const router = Router();

const completeAuthSchema = z.object({
  token: z.string().min(1, "인증 토큰이 필요합니다."),
  snsid: z.coerce.string().min(1, "e-amusement 사용자 식별자가 필요합니다."),
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

    await prisma.$transaction(async (tx) => {
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
