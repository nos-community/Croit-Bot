import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { createGradeUpdateRequest } from "../../grade/grade.service.js";
import { env } from "../../config/env.js";

export const updateCommand = {
  data: new SlashCommandBuilder()
    .setName("update")
    .setDescription("노스텔지어 곡 그레이드 합산을 실행합니다."),

  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;

    // client.ts에서 이미 deferReply가 수행되었으므로 별도의 deferReply 호출 없이 진행합니다.

    try {
      const req = await createGradeUpdateRequest(discordId);
      const updateUrl = `${env.PUBLIC_BASE_URL}/update/${req.token}`;

      try {
        await interaction.user.send(
          [
            "Croit Grade 업데이트를 시작합니다.",
            "",
            "아래 링크를 눌러 업데이트를 진행해주세요.",
            "",
            updateUrl,
            "",
            "이 링크는 10분 동안 유효합니다.",
          ].join("\n"),
        );

        await interaction.editReply({
          content: "업데이트 링크를 DM으로 전송했습니다. DM을 확인해주세요.",
        });
      } catch (dmError) {
        console.error(`[update.command] DM 전송 실패: ${discordId}`, dmError);
        await interaction.editReply({
          content: "DM을 보내지 못했습니다. DM을 허용했는지 확인해주세요.",
        });
      }
    } catch (error) {
      console.error(`[update.command] 요청 생성 실패: ${discordId}`, error);

      const errorMessage = {
        content: "업데이트 요청을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
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