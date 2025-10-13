-- AlterTable
ALTER TABLE "QueueOverlay" ADD COLUMN     "streamerId" TEXT;

-- AddForeignKey
ALTER TABLE "QueueOverlay" ADD CONSTRAINT "QueueOverlay_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
