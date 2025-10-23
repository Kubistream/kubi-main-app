/*
  Warnings:

  - You are about to drop the column `aprScale` on the `YieldProvider` table. All the data in the column will be lost.
  - You are about to drop the column `aprScaled` on the `YieldProvider` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "YieldProvider" DROP COLUMN "aprScale",
DROP COLUMN "aprScaled",
ADD COLUMN     "apr" DECIMAL(30,0);
