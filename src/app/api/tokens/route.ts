import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tokens = await prisma.token.findMany({
    select: {
      symbol: true,
      name: true,
      address: true,
      chainId: true,
      logoURI: true,
    },
    orderBy: { symbol: "asc" },
  });

  return NextResponse.json({ tokens });
}