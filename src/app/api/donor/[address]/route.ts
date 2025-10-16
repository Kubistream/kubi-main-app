import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAddress } from "ethers";

import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;

  let normalized: string;
  try {
    normalized = getAddress(address);
  } catch {
    return NextResponse.json({ displayName: null });
  }

  try {
    const donor = await prisma.user.findFirst({
      where: {
        OR: [
          { wallet: normalized },
          { wallet: normalized.toLowerCase() },
        ],
      },
      select: {
        id: true,
        wallet: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    if (!donor) {
      return NextResponse.json({ displayName: null });
    }

    const response = {
      ...donor,
      wallet: getAddress(donor.wallet),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("❌ Error fetching donor:", err);
    return NextResponse.json({ error: "Failed to fetch donor" }, { status: 500 });
  }
}
