import process from "node:process";

import { prisma } from "./prisma.js";

async function checkConnection(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const userCount = await prisma.user.count();

    console.log("데이터베이스 연결에 성공했습니다.");
    console.log(`현재 등록된 사용자 수: ${userCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection().catch((error: unknown) => {
  console.error("데이터베이스 연결에 실패했습니다.", error);
  process.exit(1);
});