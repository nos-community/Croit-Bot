# Croit-Bot
명령어 등록 양식 <br/>
경로 : Croit-Bot/src/bot/commands/...

```
export const [명령어 이름]Command = {
  data: new SlashCommandBuilder()
    .setName("[명령어 이름]")
    .setDescription("[발송될 채팅]"),

  async execute(interaction) {
    // 명령어 실행
  },
};
```

1. npm run typecheck
2. npm run format:check
상위 두 개 검사 통과 시 npm run commands:deploy 을 통해 명령어 등록