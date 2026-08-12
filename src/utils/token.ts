import crypto from "node:crypto";

export function generateAuthToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
