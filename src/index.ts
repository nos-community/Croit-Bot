import process from "node:process";

import { discordClient } from "./bot/client.js";
import { env } from "./config/env.js";

let isShuttingDown = false;

async function bootstrap(): Promise<void> {
  console.log(`Croit를 ${env.NODE_ENV} 환경에서 시작합니다.`);

  await discordClient.login(env.DISCORD_TOKEN);
}

function shutdown(signal: NodeJS.Signals): void {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`${signal} 신호를 받아 Croit를 종료합니다.`);

  discordClient.destroy();
  process.exit(0);
}

process.once("SIGINT", () => {
  shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  shutdown("SIGTERM");
});

bootstrap().catch((error: unknown) => {
  console.error("Croit 실행 중 오류가 발생했습니다.", error);
  process.exit(1);
});