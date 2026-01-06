import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking streamer data...\n');

  // Check if userId exists
  const streamerByUserId = await prisma.streamer.findFirst({
    where: { userId: 'cmk2dtipk0003a3o076i404hn' },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          username: true,
          displayName: true,
          wallet: true,
        }
      }
    }
  });

  console.log('📊 Search by userId (cmk2dtipk0003a3o076i404hn):');
  if (streamerByUserId) {
    console.log('   ✅ Found!');
    console.log('   Streamer ID:', streamerByUserId.id);
    console.log('   User ID:', streamerByUserId.userId);
    console.log('   Username:', streamerByUserId.user?.username);
    console.log('   Display Name:', streamerByUserId.user?.displayName);
    console.log('   Wallet:', streamerByUserId.user?.wallet);
  } else {
    console.log('   ❌ NOT FOUND');
  }

  // Show all streamers
  console.log('\n\n📝 All Streamers in DB:');
  const allStreamers = await prisma.streamer.findMany({
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          username: true,
          displayName: true,
        }
      }
    },
    take: 10
  });

  if (allStreamers.length === 0) {
    console.log('   ⚠️ NO STREAMERS FOUND!');
  } else {
    allStreamers.forEach(s => {
      console.log(`   - ${s.user?.username || 'no username'} [${s.userId}]`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
