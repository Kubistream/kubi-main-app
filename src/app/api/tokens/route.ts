import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const tokens = await prisma.token.findMany({
      select: {
        id: true,
        chainId: true,
        address: true,
        symbol: true,
        name: true,
        decimals: true,
        isNative: true,
        logoURI: true,
      },
      orderBy: [{ isNative: "desc" }, { symbol: "asc" }],
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error("Failed to fetch tokens", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 },
    );
  }
}

