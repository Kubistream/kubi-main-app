/*
  Warnings:

  - The `amountInRaw` column on the `Donation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `amountOutRaw` column on the `Donation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `feeRaw` column on the `Donation` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Donation" DROP COLUMN "amountInRaw",
ADD COLUMN     "amountInRaw" DECIMAL(30,8),
DROP COLUMN "amountOutRaw",
ADD COLUMN     "amountOutRaw" DECIMAL(30,8),
DROP COLUMN "feeRaw",
ADD COLUMN     "feeRaw" DECIMAL(30,8),
ALTER COLUMN "amountInIdr" SET DATA TYPE DECIMAL(30,8),
ALTER COLUMN "amountInUsd" SET DATA TYPE DECIMAL(30,8),
ALTER COLUMN "amountOutIdr" SET DATA TYPE DECIMAL(30,8),
ALTER COLUMN "amountOutUsd" SET DATA TYPE DECIMAL(30,8);
