import { Router } from "express";

import { findGradeUpdateRequestByToken } from "../../grade/grade.service.js";
import { prisma } from "../../database/prisma.js";
import { env } from "../../config/env.js";

const router = Router();

router.get("/:token", async (req, res) => {
  const token = req.params.token;

  const gradeRequest = await findGradeUpdateRequestByToken(token);

  if (!gradeRequest) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Croit Grade 업데이트</title>
      </head>
      <body>
        <h1>업데이트 요청을 찾을 수 없습니다.</h1>
        <p>존재하지 않거나 만료된 링크입니다.</p>
      </body>
      </html>
    `);

    return;
  }

  if (gradeRequest.completedAt) {
    res.status(400).send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Croit Grade 업데이트</title>
      </head>
      <body>
        <h1>이미 처리된 링크입니다.</h1>
        <p>Discord에서 다시 /update 명령어를 실행해주세요.</p>
      </body>
      </html>
    `);

    return;
  }

  if (gradeRequest.expiresAt <= new Date()) {
    res.status(410).send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Croit Grade 업데이트</title>
      </head>
      <body>
        <h1>링크가 만료되었습니다.</h1>
        <p>Discord에서 다시 /update 명령어를 실행해주세요.</p>
      </body>
      </html>
    `);

    return;
  }

  const user = await prisma.user.findUnique({
    where: { discordId: gradeRequest.discordId },
  });

  if (!user?.eamusementId) {
    res.status(400).send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Croit Grade 업데이트</title>
      </head>
      <body>
        <h1>먼저 e-amusement 인증이 필요합니다.</h1>
        <p>Discord에서 /auth 명령어를 먼저 진행해주세요.</p>
      </body>
      </html>
    `);

    return;
  }

  const extensionId = env.CROIT_EXTENSION_ID;

  res.render("grade-page", {
    token,
    extensionId,
  });
});

export { router as gradePageRouter };