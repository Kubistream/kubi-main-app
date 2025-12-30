-- AlterTable
ALTER TABLE "OverlaySettings" ADD COLUMN     "displayDuration" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "showYieldApy" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "textToSpeech" BOOLEAN NOT NULL DEFAULT false;
