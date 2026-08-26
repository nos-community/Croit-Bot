import { Router } from "express";

import { authRequestRepository } from "../../auth/repositories/auth-request.repository.js";
import { env } from "../../config/env.js";

const router = Router();

router.get("/:token", async (req, res) => {
  const token = req.params.token;

  const authRequest = await authRequestRepository.findByToken(token);

  if (!authRequest) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Croit e-amusement 인증</title>
      </head>
      <body>
        <h1>인증 요청을 찾을 수 없습니다.</h1>
        <p>존재하지 않거나 만료된 인증 링크입니다.</p>
      </body>
      </html>
    `);

    return;
  }

  if (authRequest.expiresAt <= new Date()) {
    res.status(410).send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Croit e-amusement 인증</title>
      </head>
      <body>
        <h1>인증 링크가 만료되었습니다.</h1>
        <p>Discord에서 다시 /auth 명령어를 실행해주세요.</p>
      </body>
      </html>
    `);

    return;
  }

  const extensionId = env.CROIT_EXTENSION_ID;

  res.render("auth-page", {
    token,
    extensionId,
  });
});

export { router as authPageRouter };
