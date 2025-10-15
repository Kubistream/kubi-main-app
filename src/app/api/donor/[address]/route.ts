import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;

  try {
    const donor = await prisma.user.findUnique({
      where: { wallet: address.toLowerCase() },
      select: {
        id: true,
        wallet: true,
        displayName: true,
      },
    });

    if (!donor) {
      return NextResponse.json({ displayName: null });
    }

    return NextResponse.json(donor);
  } catch (err) {
    console.error("❌ Error fetching donor:", err);
    return NextResponse.json({ error: "Failed to fetch donor" }, { status: 500 });
  }
}