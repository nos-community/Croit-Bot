import express from "express";
import { getAuthenticationRequest } from "../auth/auth.service.js";
import { sessionMiddleware } from "./middleware/session.js";

const app = express();
app.use(sessionMiddleware);

app.get("/auth/:token", async (req, res) => {
  const { token } = req.params;

  const authRequest = await getAuthenticationRequest(token);

  if (!authRequest) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Croit 인증</title>
        </head>
        <body>
          <h1>인증 요청을 찾을 수 없습니다.</h1>
          <p>인증 링크가 잘못되었거나 존재하지 않습니다.</p>
        </body>
      </html>
    `);

    return;
  }

  if (authRequest.expiresAt.getTime() < Date.now()) {
    res.status(410).send(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Croit 인증</title>
        </head>
        <body>
          <h1>인증 링크가 만료되었습니다.</h1>
          <p>Discord에서 다시 /auth 명령어를 실행해주세요.</p>
        </body>
      </html>
    `);

    return;
  }

  if (authRequest.completedAt) {
    res.status(409).send(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Croit 인증</title>
        </head>
        <body>
          <h1>이미 사용된 인증 링크입니다.</h1>
          <p>새로운 인증을 시작하려면 Discord에서 /auth 명령어를 실행해주세요.</p>
        </body>
      </html>
    `);

    return;
  }

  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Croit 인증</title>
      </head>
      <body>
        <h1>Croit 인증</h1>
        <p>인증 요청이 확인되었습니다.</p>
        <p>다음 단계에서 e-amusement 로그인을 진행합니다.</p>
      </body>
    </html>
  `);
});

export function startWebServer(port: number) {
  app.listen(port, () => {
    console.log(`Croit 웹 서버가 ${port}번 포트에서 시작되었습니다.`);
  });
}