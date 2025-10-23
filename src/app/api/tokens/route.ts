import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Returns only tokens that are allowed in the global whitelist
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const representativeParam = url.searchParams.get("representative");
    const filterRepresentative = representativeParam === null ? undefined : representativeParam === "true";
    const skipWhitelist = url.searchParams.get("skipWhitelist") === "true";

    const tokens = await prisma.token.findMany({
      where: {
        ...(skipWhitelist
          ? {}
          : {
              // Include only tokens that have a GlobalTokenWhitelist record with allowed = true
              globalWhitelist: {
                is: { allowed: true },
              },
            }),
        ...(typeof filterRepresentative === "boolean"
          ? { isRepresentativeToken: filterRepresentative }
          : {}),
      },
      select: {
        id: true,
        chainId: true,
        address: true,
        symbol: true,
        name: true,
        decimals: true,
        isRepresentativeToken: true,
        logoURI: true,
      },
      orderBy: [{ symbol: "asc" }],
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
