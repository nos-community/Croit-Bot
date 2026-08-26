import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from "discord.js";

import { authCommand } from "./commands/auth.command.js";
import { pingCommand } from "./commands/ping.command.js";
import { updateCommand } from "./commands/update.command.js";

const commands = new Collection<string, typeof pingCommand>();

commands.set(pingCommand.data.name, pingCommand);
commands.set(authCommand.data.name, authCommand);
commands.set(updateCommand.data.name, updateCommand);

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
  try {
    console.log(
      `[InteractionCreate] id=${interaction.id} type=${interaction.type} user=${interaction.user?.tag ?? interaction.user?.id} command=${"commandName" in interaction ? (interaction as any).commandName : "-"}`,
    );
  } catch (logErr) {
    // ignore logging errors
  }

  if (!interaction.isChatInputCommand()) {
    console.log("[InteractionCreate] 비채팅 명령 또는 다른 인터랙션 유형입니다.");
    return;
  }

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.warn(`[InteractionCreate] 등록되지 않은 명령: ${interaction.commandName}`);
    return;
  }

  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true }).catch(() => {});
    }

    await command.execute(interaction);
  } catch (error) {
    console.error(`${interaction.commandName} 명령어 실행 중 오류가 발생했습니다.`, error);

    const errorMessage = {
      content: "명령어 실행 중 오류가 발생했습니다.",
      ephemeral: true,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMessage).catch(async () => {
        await interaction.followUp(errorMessage).catch(() => {});
      });
    } else {
      await interaction.reply(errorMessage).catch(() => {});
    }
  }
});