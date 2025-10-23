/*
  Warnings:

  - You are about to alter the column `apr` on the `YieldProvider` table. The data in that column could be lost. The data in that column will be cast from `Decimal(30,0)` to `Decimal(30,2)`.

*/
-- AlterTable
ALTER TABLE "YieldProvider" ALTER COLUMN "apr" SET DATA TYPE DECIMAL(30,2);
