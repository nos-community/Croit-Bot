import "express-session";

declare module "express-session" {
  interface SessionData {
    authRequestId?: string;
    discordId?: string;
  }
}