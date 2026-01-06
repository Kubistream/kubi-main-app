import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testing streamer search...\n');

  const channelId = 'cmk2dtipk0003a3o076i404hn';

  // Test with new query (same as API)
  const streamer = await prisma.streamer.findFirst({
    where: {
      OR: [
        { id: channelId },
        { userId: channelId },
        { user: { username: channelId } },
      ]
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          username: true,
          displayName: true,
          wallet: true,
          avatarUrl: true,
        }
      },
      primaryTokenId: true,
      overlaySettings: {
        select: {
          minAmountUsd: true,
          minAudioAmountUsd: true,
          minVideoAmountUsd: true,
        }
      }
    },
  });

  console.log('📊 Search Result:');
  if (streamer) {
    console.log('   ✅ Found!');
    console.log('   Streamer ID:', streamer.id);
    console.log('   User ID:', streamer.userId);
    console.log('   Username:', streamer.user?.username);
    console.log('   Display Name:', streamer.user?.displayName);
    console.log('   Wallet:', streamer.user?.wallet);
    console.log('   Primary Token ID:', streamer.primaryTokenId);
    console.log('   Avatar URL:', streamer.user?.avatarUrl || 'not set');
    console.log('   Overlay Min Amount:', streamer.overlaySettings?.minAmountUsd || 'not set');
  } else {
    console.log('   ❌ STILL NOT FOUND - This streamer ID does not exist in DB');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
