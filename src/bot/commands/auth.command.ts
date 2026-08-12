import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { createAuthenticationRequest } from "../../auth/auth.service.js";
import { env } from "../../config/env.js";

export const authCommand = {
  data: new SlashCommandBuilder()
    .setName("auth")
    .setDescription("e-amusement 계정 인증을 시작합니다."),

  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;

    const authRequest = await createAuthenticationRequest(discordId);

    const authUrl = `${env.PUBLIC_BASE_URL}/auth/${authRequest.token}`;

    try {
      await interaction.user.send(
        [
          "Croit 인증을 시작합니다.",
          "",
          "아래 링크를 눌러 인증을 진행해주세요.",
          "",
          authUrl,
          "",
          "이 인증 링크는 10분 동안 유효합니다.",
        ].join("\n"),
      );

      await interaction.reply({
        content: "인증 링크를 DM으로 전송했습니다. DM을 확인해주세요.",
        ephemeral: true,
      });
    } catch {
      await interaction.reply({
        content: "DM을 보내지 못했습니다. 서버 설정에서 DM 수신이 허용되어 있는지 확인해주세요.",
        ephemeral: true,
      });
    }
  },
};
