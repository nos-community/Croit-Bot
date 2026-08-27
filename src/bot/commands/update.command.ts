import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { env } from "../../config/env.js";
import { createGradeUpdateRequest } from "../../grade/grade.service.js";

export const updateCommand = {
  data: new SlashCommandBuilder()
    .setName("update")
    .setDescription("노스텔지어 곡 그레이드 합산을 실행합니다."),

  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;

    try {
      const req = await createGradeUpdateRequest(discordId);
      const updateUrl = `${env.PUBLIC_BASE_URL}/update/${req.token}`;

      const messageContent = [
        "Croit Grade 업데이트를 시작합니다.",
        "",
        "아래 링크를 눌러 업데이트를 진행해주세요.",
        "",
        updateUrl,
        "",
        "이 링크는 10분 동안 유효합니다.",
      ].join("\n");

      await interaction.user.send(messageContent);
      await interaction.editReply({
        content: "DM으로 그레이드 갱신 링크를 보냈습니다! DM을 확인해 주세요.",
      });
    } catch (error) {
      console.error("[update.command] 오류:", error);
      await interaction.editReply({
        content:
          "DM을 보낼 수 없습니다. 디스코드 개인정보 설정에서 서버 멤버의 DM 수신을 허용해 주세요.",
      });
    }
  },
};