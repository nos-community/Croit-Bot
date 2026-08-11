import process from "node:process";

import { discordClient } from "./bot/client.js";
import { env } from "./config/env.js";
import { prisma } from "./database/prisma.js";
import { startWebServer } from "./web/server.js";

let isShuttingDown = false;

async function bootstrap(): Promise<void> {
  console.log(`Croit를 ${env.NODE_ENV} 환경에서 시작합니다.`);

  await prisma.$connect();
  console.log("데이터베이스에 연결했습니다.");

  startWebServer(env.PORT);

  await discordClient.login(env.DISCORD_TOKEN);
}

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`${signal} 신호를 받아 Croit를 종료합니다.`);

  discordClient.destroy();
  await prisma.$disconnect();

  console.log("데이터베이스 연결을 종료했습니다.");
  process.exit(0);
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

bootstrap().catch(async (error: unknown) => {
  console.error("Croit 실행 중 오류가 발생했습니다.", error);

  discordClient.destroy();
  await prisma.$disconnect();

  process.exit(1);
});
