import express from "express";
import path from "node:path";

import { authRouter } from "./routes/auth.routes.js";
import { authPageRouter } from "./routes/auth-page.route.js";
import { eamusementRouter } from "./routes/eamusement.route.js";

export function startWebServer(port: number) {
  const app = express();

  // JSON body parsing
  app.use(express.json());

  // Set view engine and views directory
  app.set("view engine", "ejs");
  app.set("views", path.join(process.cwd(), "src/web/views"));

  // Serve static assets (CSS/JS) under /public
  app.use("/public", express.static(path.join(process.cwd(), "src/web/public")));

  // API
  app.use("/api/auth", authRouter);

  // 인증 페이지
  app.use("/auth", authPageRouter);

  app.use("/api/eamusement", eamusementRouter);

  app.listen(port, () => {
    console.log(`웹 서버가 ${port}번 포트에서 실행되었습니다.`);
  });
}
