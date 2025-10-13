import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // pastikan sudah ada prisma.ts

export async function GET(
  request: Request,
  { params }: { params: { channel: string } }
) {
  try {
    const { channel } = params;

    const streamer = await prisma.streamer.findUnique({
      where: { userId: channel },
      select: {
        id: true,
        userId: true,
        user: true,
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