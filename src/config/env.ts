import process from "node:process";
import "dotenv/config";
import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.url().optional());

const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(32).optional(),
);

const requiredString = (name: string) =>
  z
    .string({
      error: `${name}이(가) 설정되지 않았습니다.`,
    })
    .min(1, `${name}이(가) 비어 있습니다.`);

const discordSnowflake = (name: string) =>
  requiredString(name).regex(/^\d{17,20}$/, `${name} 형식이 올바르지 않습니다.`);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DISCORD_TOKEN: requiredString("DISCORD_TOKEN"),
  DISCORD_CLIENT_ID: discordSnowflake("DISCORD_CLIENT_ID"),
  DISCORD_GUILD_ID: discordSnowflake("DISCORD_GUILD_ID"),

  // Optional: role ID to assign after verification
  VERIFIED_ROLE_ID: discordSnowflake("VERIFIED_ROLE_ID").optional(),
  // Optional: nickname format applied after verification. Use '{current}' to include current display name.
  VERIFIED_NICKNAME_FORMAT: z.string().min(1).default("{current} | Grd.{basicGrade}"),

  PORT: z.coerce.number().int().positive().default(3000),

  PUBLIC_BASE_URL: optionalUrl.default("http://localhost:3000"),

  DATABASE_URL: requiredString("DATABASE_URL"),
  AUTH_TOKEN_SECRET: optionalSecret,

  CROIT_EXTENSION_ID: requiredString("CROIT_EXTENSION_ID"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("환경 변수 설정에 오류가 있습니다.", parsedEnv.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = parsedEnv.data;
