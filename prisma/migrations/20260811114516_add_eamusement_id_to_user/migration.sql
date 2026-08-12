/*
  Warnings:

  - The primary key for the `AuthRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[eamusement_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `id` on the `AuthRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "AuthRequest" DROP CONSTRAINT "AuthRequest_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "AuthRequest_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "eamusement_id" TEXT;

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" UUID NOT NULL,
    "authRequestId" UUID NOT NULL,
    "discordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_authRequestId_key" ON "AuthSession"("authRequestId");

-- CreateIndex
CREATE INDEX "AuthSession_discordId_idx" ON "AuthSession"("discordId");

-- CreateIndex
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_eamusement_id_key" ON "users"("eamusement_id");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_authRequestId_fkey" FOREIGN KEY ("authRequestId") REFERENCES "AuthRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
