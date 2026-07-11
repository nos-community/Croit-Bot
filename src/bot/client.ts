import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";

export const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds],
});

discordClient.once(Events.ClientReady, (readyClient) => {
  console.log(`Croit가 접속했습니다: ${readyClient.user.tag}`);
});

discordClient.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === "ping") {
    const websocketLatency = Math.round(interaction.client.ws.ping);

    await interaction.reply({
      content: `퐁! 현재 지연 시간은 ${websocketLatency}ms입니다.`,
      flags: MessageFlags.Ephemeral,
    });
  }
});
