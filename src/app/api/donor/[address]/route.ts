import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const donor = await prisma.user.findUnique({
      where: { wallet: params.address.toLowerCase() },
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