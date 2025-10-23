-- CreateEnum
CREATE TYPE "OverlayStatus" AS ENUM ('PENDING', 'ON_PROCESS', 'DISPLAYED');

-- CreateTable
CREATE TABLE "QueueOverlay" (
    "id" TEXT NOT NULL,
    "linkId" TEXT,
    "tokenInId" TEXT NOT NULL,
    "amountInRaw" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "status" "OverlayStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "QueueOverlay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QueueOverlay_linkId_idx" ON "QueueOverlay"("linkId");

-- CreateIndex
CREATE INDEX "QueueOverlay_txHash_idx" ON "QueueOverlay"("txHash");

-- AddForeignKey
ALTER TABLE "QueueOverlay" ADD CONSTRAINT "QueueOverlay_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "DonationLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueOverlay" ADD CONSTRAINT "QueueOverlay_tokenInId_fkey" FOREIGN KEY ("tokenInId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
