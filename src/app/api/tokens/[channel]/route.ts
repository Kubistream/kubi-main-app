import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ channel: string }> }
) {
  const { channel } = await context.params;
  try {
    // cari streamer berdasarkan slug channel
    const streamer = await prisma.streamer.findUnique({
      where: { userId: channel },
      select: { 
        id: true,
        userId: true,
        primaryTokenId: true,
        primaryToken: true
      },
    });


    if (!streamer) {
      return NextResponse.json({ tokens: [] });
    }

    // ambil token yang di-whitelist untuk streamer itu
    const whitelistedTokens = await prisma.streamerTokenWhitelist.findMany({
      where: {
        streamerId: streamer.id,
        allowed: true,
        token: {
          globalWhitelist: { is: { allowed: true } },
        },
      },
      include: { token: true },
    });

    const tokens = whitelistedTokens.map((item) => ({
      symbol: item.token.symbol,
      name: item.token.name,
      address: item.token.address,
      chainId: item.token.chainId,
      logoURI: item.token.logoURI,
      isTokenPrimary: item.token.id === streamer.primaryTokenId,
    }));

    return NextResponse.json({ tokens });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load tokens" }, { status: 500 });
  }
}
