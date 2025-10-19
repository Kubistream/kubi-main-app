-- CreateEnum
CREATE TYPE "YieldProviderStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "APRSource" AS ENUM ('ONCHAIN', 'SUBGRAPH', 'PROTOCOL_API', 'MANUAL');

-- CreateTable
CREATE TABLE "YieldProvider" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "protocol" TEXT NOT NULL,
    "protocolName" TEXT NOT NULL,
    "protocolImageUrl" TEXT,
    "underlyingTokenId" TEXT NOT NULL,
    "representativeTokenId" TEXT NOT NULL,
    "status" "YieldProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "adapterKey" TEXT NOT NULL,
    "aprSource" "APRSource" NOT NULL DEFAULT 'ONCHAIN',
    "aprScaled" DECIMAL(30,0),
    "aprScale" INTEGER NOT NULL DEFAULT 18,
    "aprUpdatedAt" TIMESTAMP(3),
    "extraData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YieldProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YieldProvider_chainId_idx" ON "YieldProvider"("chainId");

-- CreateIndex
CREATE INDEX "YieldProvider_status_idx" ON "YieldProvider"("status");

-- CreateIndex
CREATE INDEX "YieldProvider_underlyingTokenId_idx" ON "YieldProvider"("underlyingTokenId");

-- CreateIndex
CREATE INDEX "YieldProvider_aprUpdatedAt_idx" ON "YieldProvider"("aprUpdatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "YieldProvider_representativeTokenId_key" ON "YieldProvider"("representativeTokenId");

-- AddForeignKey
ALTER TABLE "YieldProvider" ADD CONSTRAINT "YieldProvider_underlyingTokenId_fkey" FOREIGN KEY ("underlyingTokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YieldProvider" ADD CONSTRAINT "YieldProvider_representativeTokenId_fkey" FOREIGN KEY ("representativeTokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
