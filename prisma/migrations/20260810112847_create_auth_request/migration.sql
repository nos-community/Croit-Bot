-- CreateTable
CREATE TABLE "AuthRequest" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthRequest_token_key" ON "AuthRequest"("token");

-- CreateIndex
CREATE INDEX "AuthRequest_token_idx" ON "AuthRequest"("token");
