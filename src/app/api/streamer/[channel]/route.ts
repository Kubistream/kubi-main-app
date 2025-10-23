import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma"; // pastikan sudah ada prisma.ts

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ channel: string }> }
) {
  const { channel } = await context.params;
  try {

    const streamer = await prisma.streamer.findFirst({
      where: { userId: channel },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            displayName: true,
            wallet: true,
            avatarUrl: true,
            username: true,
          },
        },
        primaryTokenId: true,
        createdAt: true
      },
    });

    if (!streamer) {
      return NextResponse.json(
        { error: "Streamer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(streamer);
  } catch (err) {
    console.error("❌ Error fetching streamer:", err);
    return NextResponse.json(
      { error: "Failed to fetch streamer" },
      { status: 500 }
    );
  }
}
