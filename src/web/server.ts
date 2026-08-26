import express from "express";

import { authRouter } from "./routes/auth.routes.js";
import { authPageRouter } from "./routes/auth-page.route.js";
import { eamusementRouter } from "./routes/eamusement.route.js";

export function startWebServer(port: number) {
  const app = express();

  app.use(express.json());

  // API
  app.use("/api/auth", authRouter);

  // 인증 페이지
  app.use("/auth", authPageRouter);

  app.use("/api/eamusement", eamusementRouter);

  app.listen(port, () => {
    console.log(`웹 서버가 ${port}번 포트에서 실행되었습니다.`);
  });
}
