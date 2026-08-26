import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { createAuthenticationRequest } from "../../auth/auth.service.js";
import { env } from "../../config/env.js";

export const authCommand = {
  data: new SlashCommandBuilder()
    .setName("auth")
    .setDescription("e-amusement 계정 인증을 시작합니다."),

  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;
    console.log(`[auth.command] execute start discordId=${discordId}`);


    try {
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

        await interaction.editReply({
          content: "인증 링크를 DM으로 전송했습니다. DM을 확인해주세요.",
        });
        console.log(`[auth.command] DM 전송 성공: ${discordId} -> ${authUrl}`);
      } catch (dmError) {
        console.error(`[auth.command] DM 전송 실패: ${discordId}`, dmError);
        await interaction.editReply({
          content: "DM을 보내지 못했습니다. 서버 설정에서 DM 수신이 허용되어 있는지 확인해주세요.",
        });
      }
    } catch (error) {
      console.error(`[auth.command] 인증 요청 생성 실패: ${discordId}`, error);

      const errorMessage = {
        content: "인증 요청을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorMessage).catch(async () => {
          await interaction.followUp({ ...errorMessage, ephemeral: true }).catch(() => {});
        });
      } else {
        await interaction.followUp({ ...errorMessage, ephemeral: true }).catch(() => {});
      }
    }
  },
};