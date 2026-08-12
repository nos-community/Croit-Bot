import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from "discord.js";

export const pingCommand = {
  data: new SlashCommandBuilder().setName("ping").setDescription("현재 지연 시간을 확인합니다."),

  async execute(interaction: ChatInputCommandInteraction) {
    const websocketLatency = Math.round(interaction.client.ws.ping);

    await interaction.reply({
      content: `퐁! 현재 지연 시간은 ${websocketLatency}ms입니다.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
