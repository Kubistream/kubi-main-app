import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking database...\n");

  // Check tokens
  const totalTokens = await prisma.token.count();
  const activeTokens = await prisma.token.count({
    where: { isDeleted: false }
  });
  const deletedTokens = await prisma.token.count({
    where: { isDeleted: true }
  });

  console.log("📊 Token Statistics:");
  console.log(`   Total tokens: ${totalTokens}`);
  console.log(`   Active tokens: ${activeTokens}`);
  console.log(`   Deleted tokens: ${deletedTokens}\n`);

  // Check whitelist
  const whitelistEntries = await prisma.globalTokenWhitelist.count();
  const allowedTokens = await prisma.globalTokenWhitelist.count({
    where: { allowed: true }
  });

  console.log("📋 Whitelist Statistics:");
  console.log(`   Total whitelist entries: ${whitelistEntries}`);
  console.log(`   Allowed tokens: ${allowedTokens}\n`);

  // Show sample tokens
  const sampleTokens = await prisma.token.findMany({
    where: {
      isDeleted: false,
      globalWhitelist: {
        is: { allowed: true }
      }
    },
    select: {
      symbol: true,
      name: true,
      chainId: true,
      address: true,
      globalWhitelist: {
        select: {
          allowed: true
        }
      }
    },
    take: 5
  });

  console.log("🪙 Sample Tokens (that would show in API):");
  if (sampleTokens.length === 0) {
    console.log("   ⚠️ NO TOKENS FOUND! This explains why the list is empty.");
  } else {
    sampleTokens.forEach(token => {
      console.log(`   - ${token.symbol} (${token.name}) [Chain ${token.chainId}]`);
      console.log(`     Address: ${token.address}`);
      console.log(`     Whitelisted: ${token.globalWhitelist?.allowed ? '✅' : '❌'}\n`);
    });
  }

  // Show all tokens if count is low
  if (activeTokens < 20) {
    const allActiveTokens = await prisma.token.findMany({
      where: { isDeleted: false },
      select: {
        symbol: true,
        chainId: true,
        isDeleted: true
      }
    });

    console.log("\n📝 All Active Tokens in DB:");
    allActiveTokens.forEach(token => {
      console.log(`   - ${token.symbol} [Chain ${token.chainId}]`);
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
