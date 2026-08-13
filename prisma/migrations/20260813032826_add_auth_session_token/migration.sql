/*
  Warnings:

  - A unique constraint covering the columns `[session_token]` on the table `AuthSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `session_token` to the `AuthSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AuthSession" ADD COLUMN     "session_token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_session_token_key" ON "AuthSession"("session_token");
