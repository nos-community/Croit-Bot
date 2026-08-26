import { env } from "../config/env.js";

export function formatNickname(baseNickname: string, gradeValue: string | number): string {
  const rawFormat = env.VERIFIED_NICKNAME_FORMAT ?? "{current} | Grd.{grade}";

  // Replace placeholders using baseNickname and gradeValue
  let result = rawFormat.replace("{current}", baseNickname ?? "");
  // Support multiple placeholders for grade (english and Korean variable name)
  result = result.replace("{grade}", String(gradeValue));
  result = result.replace("{그레이드}", String(gradeValue));

  // Enforce 32 character limit before returning
  if (result.length > 32) {
    return result.slice(0, 32).trim();
  }

  return result;
}
