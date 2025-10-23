/*
  Warnings:

  - You are about to drop the column `isNative` on the `Token` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Token" DROP COLUMN "isNative",
ADD COLUMN     "isRepresentativeToken" BOOLEAN NOT NULL DEFAULT false;
