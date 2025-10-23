-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "amountInIdr" BIGINT,
ADD COLUMN     "amountInUsd" BIGINT,
ADD COLUMN     "amountOutIdr" BIGINT,
ADD COLUMN     "amountOutUsd" BIGINT;

-- CreateIndex
CREATE INDEX "Donation_tokenInId_idx" ON "Donation"("tokenInId");

-- CreateIndex
CREATE INDEX "Donation_tokenOutId_idx" ON "Donation"("tokenOutId");

-- CreateIndex
CREATE INDEX "Donation_streamerId_timestamp_idx" ON "Donation"("streamerId", "timestamp");
