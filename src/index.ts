import { discordClient } from "./bot/client.js";
import { env } from "./config/env.js";

async function bootstrap(): Promise<void> {
  console.log(`Croit를 ${env.NODE_ENV} 환경에서 시작합니다.`);

  await discordClient.login(env.DISCORD_TOKEN);
}

bootstrap().catch((error: unknown) => {
  console.error("Croit 실행 중 오류가 발생했습니다.", error);
  process.exit(1);
});
