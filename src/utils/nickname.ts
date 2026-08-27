import { env } from "../config/env.js";

export function formatNickname(baseNickname: string, gradeValue: string | number): string {
  const rawFormat = env.VERIFIED_NICKNAME_FORMAT ?? "{current} | Grd.{basicGrade}";

  let result = rawFormat
    .replace("{current}", baseNickname ?? "")
    .replace("{basicGrade}", String(gradeValue));

  if (result.length > 32) {
    return result.slice(0, 32).trim();
  }

  return result;
}