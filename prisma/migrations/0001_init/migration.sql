-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'STREAMER', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ORPHANED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streamer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "primaryTokenId" TEXT,
    "autoswapEnabled" BOOLEAN NOT NULL DEFAULT true,
    "slippageBps" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Streamer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationLink" (
    "id" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "welcomeMsg" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "linkId" TEXT,
    "streamerId" TEXT NOT NULL,
    "donorWallet" TEXT,
    "tokenInId" TEXT NOT NULL,
    "tokenOutId" TEXT NOT NULL,
    "amountInRaw" TEXT NOT NULL,
    "amountOutRaw" TEXT NOT NULL,
    "feeRaw" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "status" "DonationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "decimals" INTEGER NOT NULL,
    "isNative" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalTokenWhitelist" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalTokenWhitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamerTokenWhitelist" (
    "id" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreamerTokenWhitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OverlaySettings" (
    "id" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "theme" TEXT,
    "soundUrl" TEXT,
    "animationPreset" TEXT,
    "showLeaderboard" BOOLEAN NOT NULL DEFAULT true,
    "minAmountUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "authSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OverlaySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OverlayToken" (
    "id" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OverlayToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformFeeHistory" (
    "id" TEXT NOT NULL,
    "feeBps" INTEGER NOT NULL,
    "feeRecipient" TEXT NOT NULL,
    "txHash" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformFeeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "streamerId" TEXT,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "eventTypes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_key" ON "User"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Streamer_userId_key" ON "Streamer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Streamer_username_key" ON "Streamer"("username");

-- CreateIndex
CREATE UNIQUE INDEX "DonationLink_slug_key" ON "DonationLink"("slug");

-- CreateIndex
CREATE INDEX "Donation_streamerId_idx" ON "Donation"("streamerId");

-- CreateIndex
CREATE INDEX "Donation_txHash_idx" ON "Donation"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_txHash_logIndex_key" ON "Donation"("txHash", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Token_chainId_address_key" ON "Token"("chainId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalTokenWhitelist_tokenId_key" ON "GlobalTokenWhitelist"("tokenId");

-- CreateIndex
CREATE INDEX "StreamerTokenWhitelist_tokenId_idx" ON "StreamerTokenWhitelist"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "StreamerTokenWhitelist_streamerId_tokenId_key" ON "StreamerTokenWhitelist"("streamerId", "tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "OverlaySettings_streamerId_key" ON "OverlaySettings"("streamerId");

-- CreateIndex
CREATE UNIQUE INDEX "OverlayToken_token_key" ON "OverlayToken"("token");

-- CreateIndex
CREATE INDEX "OverlayToken_streamerId_idx" ON "OverlayToken"("streamerId");

-- CreateIndex
CREATE INDEX "OverlayToken_expiresAt_idx" ON "OverlayToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "Webhook_streamerId_idx" ON "Webhook"("streamerId");

-- AddForeignKey
ALTER TABLE "Streamer" ADD CONSTRAINT "Streamer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Streamer" ADD CONSTRAINT "Streamer_primaryTokenId_fkey" FOREIGN KEY ("primaryTokenId") REFERENCES "Token"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationLink" ADD CONSTRAINT "DonationLink_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "DonationLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_tokenInId_fkey" FOREIGN KEY ("tokenInId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_tokenOutId_fkey" FOREIGN KEY ("tokenOutId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalTokenWhitelist" ADD CONSTRAINT "GlobalTokenWhitelist_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalTokenWhitelist" ADD CONSTRAINT "GlobalTokenWhitelist_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamerTokenWhitelist" ADD CONSTRAINT "StreamerTokenWhitelist_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamerTokenWhitelist" ADD CONSTRAINT "StreamerTokenWhitelist_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamerTokenWhitelist" ADD CONSTRAINT "StreamerTokenWhitelist_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverlaySettings" ADD CONSTRAINT "OverlaySettings_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverlayToken" ADD CONSTRAINT "OverlayToken_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformFeeHistory" ADD CONSTRAINT "PlatformFeeHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

