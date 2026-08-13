import { randomBytes } from "node:crypto";

export function createAuthSessionToken(): string {
  return randomBytes(32).toString("hex");
}