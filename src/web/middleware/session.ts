import session from "express-session";

export const sessionMiddleware = session({
  secret: process.env.AUTH_TOKEN_SECRET ?? "",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // 아직 개발중이라 false로 설정, 배포시 true로 변경 필요
    sameSite: "lax",
  },
});