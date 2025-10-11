/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `Streamer` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `Streamer` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `Streamer` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Streamer` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Streamer_username_key";

-- AlterTable
ALTER TABLE "Streamer" DROP COLUMN "avatarUrl",
DROP COLUMN "bio",
DROP COLUMN "displayName",
DROP COLUMN "username";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "displayName" TEXT;
