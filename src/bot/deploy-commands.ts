import { REST, Routes } from "discord.js";

import { env } from "../config/env.js";
import { pingCommand } from "./commands/ping.command.js";

const commands = [pingCommand.toJSON()];

const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

async function deployCommands(): Promise<void> {
  console.log(`${env.DISCORD_GUILD_ID} 서버에 ${commands.length}개의 명령어를 등록합니다.`);

  await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID), {
    body: commands,
  });

  console.log("서버 전용 슬래시 명령어 등록이 완료되었습니다.");
}

deployCommands().catch((error: unknown) => {
  console.error("슬래시 명령어 등록에 실패했습니다.", error);
  process.exit(1);
});
