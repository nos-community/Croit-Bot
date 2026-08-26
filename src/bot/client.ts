import { Client, Collection, Events, GatewayIntentBits } from "discord.js";

import { authCommand } from "./commands/auth.command.js";
import { pingCommand } from "./commands/ping.command.js";

const commands = new Collection<string, typeof pingCommand>();

commands.set(pingCommand.data.name, pingCommand);
commands.set(authCommand.data.name, authCommand);

export const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

discordClient.once(Events.ClientReady, (readyClient) => {
  console.log(`Croit가 접속했습니다: ${readyClient.user.tag}`);
});

// Global client error handler to prevent uncaught 'error' events from crashing the process
discordClient.on("error", (error) => {
  console.error("Discord client error:", error);
});

discordClient.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commands.get(interaction.commandName);

  if (!command) {
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`${interaction.commandName} 명령어 실행 중 오류가 발생했습니다.`, error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "명령어를 실행하는 중 오류가 발생했습니다.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "명령어를 실행하는 중 오류가 발생했습니다.",
          ephemeral: true,
        });
      }
    } catch (replyError) {
      // Interaction may be expired/unknown (e.g., took too long). Log and continue without throwing.
      console.error("오류 응답 전송에 실패했습니다.", replyError);
    }
  }
});
