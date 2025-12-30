import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getAddress } from "ethers";

import {
  applySessionCookies,
  getAuthSession,
  resolveAuthenticatedUser,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const VALID_RANGES = new Set([
  "1d",
  "7d",
  "1w",
  "1m",
  "ytd",
  "1y",
  "5y",
  "all",
]);

const VALID_SORT = new Set(["asc", "desc"]);
const VALID_CURRENCIES = new Set(["usd", "idr"]);

function getRangeStart(range: string): Date | null {
  const now = new Date();

  switch (range) {
    case "1d": {
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    case "7d":
    case "1w": {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    case "1m": {
      const copy = new Date(now);
      copy.setMonth(copy.getMonth() - 1);
      return copy;
    }
    case "ytd": {
      return new Date(now.getFullYear(), 0, 1);
    }
    case "1y": {
      const copy = new Date(now);
      copy.setFullYear(copy.getFullYear() - 1);
      return copy;
    }
    case "5y": {
      const copy = new Date(now);
      copy.setFullYear(copy.getFullYear() - 5);
      return copy;
    }
    case "all":
    default:
      return null;
  }
}

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;
  try {
    return value.toNumber();
  } catch {
    return Number(value);
  }
}

function formatWallet(address: string | null): string | null {
  if (!address) return null;
  try {
    return getAddress(address);
  } catch {
    return address;
  }
}

export async function GET(request: NextRequest) {
  const { session, sessionResponse } = await getAuthSession(request);
  const sessionRecord = await resolveAuthenticatedUser(session);

  if (!sessionRecord || !sessionRecord.user.streamer?.id) {
    const response = NextResponse.json(
      { error: "Creator access required" },
      { status: 403 },
    );
    return applySessionCookies(sessionResponse, response);
  }

  const searchParams = request.nextUrl.searchParams;
  const requestedRange = searchParams.get("range")?.toLowerCase() ?? "all";
  const range = VALID_RANGES.has(requestedRange) ? requestedRange : "all";
  const requestedCurrency = searchParams.get("currency")?.toLowerCase() ?? "usd";
  const currency = VALID_CURRENCIES.has(requestedCurrency)
    ? (requestedCurrency as "usd" | "idr")
    : "usd";
  const requestedSort = searchParams.get("sort")?.toLowerCase() ?? "desc";
  const sortDirection = VALID_SORT.has(requestedSort)
    ? (requestedSort as "asc" | "desc")
    : "desc";

  const rangeStart = getRangeStart(range);

  const donations = await prisma.donation.findMany({
    where: {
      streamerId: sessionRecord.user.streamer.id,
      status: "CONFIRMED",
      ...(rangeStart
        ? {
          timestamp: {
            gte: rangeStart,
          },
        }
        : null),
    },
    select: {
      donorWallet: true,
      amountInUsd: true,
      amountInIdr: true,
      amountInRaw: true,
      tokenInId: true,
      tokenIn: {
        select: {
          id: true,
          symbol: true,
          name: true,
          logoURI: true,
          decimals: true,
        },
      },
    },
    orderBy: {
      timestamp: "desc",
    },
    // Limit to prevent performance issues with large datasets
    take: 10000,
  });

  const supportersMap = new Map<
    string,
    {
      walletChecksum: string | null;
      walletRaw: string | null;
      totalAmount: number;
      donationCount: number;
      tokens: Map<
        string,
        {
          tokenId: string | null;
          symbol: string | null;
          name: string | null;
          logoURI: string | null;
          decimals: number | null;
          amountRaw: number;
        }
      >;
    }
  >();

  for (const donation of donations) {
    const walletKey = donation.donorWallet
      ? donation.donorWallet.toLowerCase()
      : "__anonymous__";

    if (!supportersMap.has(walletKey)) {
      supportersMap.set(walletKey, {
        walletChecksum: formatWallet(donation.donorWallet ?? null),
        walletRaw: donation.donorWallet ?? null,
        totalAmount: 0,
        donationCount: 0,
        tokens: new Map(),
      });
    }

    const supporter = supportersMap.get(walletKey);
    if (!supporter) continue;

    const contribution =
      currency === "usd"
        ? decimalToNumber(donation.amountInUsd)
        : decimalToNumber(donation.amountInIdr);

    supporter.totalAmount += contribution;
    supporter.donationCount += 1;

    const tokenKey = donation.tokenInId ?? "unknown";
    if (!supporter.tokens.has(tokenKey)) {
      supporter.tokens.set(tokenKey, {
        tokenId: donation.tokenIn?.id ?? donation.tokenInId ?? null,
        symbol: donation.tokenIn?.symbol ?? null,
        name: donation.tokenIn?.name ?? null,
        logoURI: donation.tokenIn?.logoURI ?? null,
        decimals: donation.tokenIn?.decimals ?? null,
        amountRaw: 0,
      });
    }

    const token = supporter.tokens.get(tokenKey);
    if (token) {
      token.amountRaw += decimalToNumber(donation.amountInRaw);
    }
  }

  const walletLookup = new Set<string>();
  supportersMap.forEach((supporter) => {
    if (supporter.walletRaw) {
      walletLookup.add(supporter.walletRaw);
    }
  });

  const userRecords =
    walletLookup.size > 0
      ? await prisma.user.findMany({
        where: { wallet: { in: Array.from(walletLookup.values()) } },
        select: { wallet: true, displayName: true },
      })
      : [];

  const displayNameByWallet = new Map<string, string | null>();
  for (const record of userRecords) {
    if (!record.wallet) continue;
    displayNameByWallet.set(record.wallet.toLowerCase(), record.displayName ?? null);
  }

  const supporters = Array.from(supportersMap.values())
    .filter((supporter) => supporter.totalAmount > 0)
    .map((supporter) => {
      const walletLower = supporter.walletRaw?.toLowerCase() ?? null;
      const displayName =
        walletLower && displayNameByWallet.has(walletLower)
          ? displayNameByWallet.get(walletLower) ?? null
          : null;

      return {
        wallet: supporter.walletChecksum,
        totalAmount: supporter.totalAmount,
        donationCount: supporter.donationCount,
        displayName,
        tokens: Array.from(supporter.tokens.values())
          .map((token) => {
            const decimals = Math.max(0, token.decimals ?? 18);
            const divisor = decimals > 0 ? Math.pow(10, decimals) : 1;
            const normalized =
              divisor && Number.isFinite(divisor) ? token.amountRaw / divisor : token.amountRaw;

            return {
              ...token,
              amount: normalized,
            };
          })
          .filter(
            (token) =>
              Number.isFinite(token.amount) &&
              token.amount > 0 &&
              Number.isFinite(token.amountRaw) &&
              token.amountRaw > 0,
          ),
      };
    });

  supporters.sort((a, b) => {
    if (sortDirection === "asc") {
      return a.totalAmount - b.totalAmount;
    }
    return b.totalAmount - a.totalAmount;
  });

  const response = NextResponse.json({
    supporters,
    meta: {
      range,
      currency,
      sort: sortDirection,
      generatedAt: new Date().toISOString(),
    },
  });

  // Cache the response for 30 seconds to reduce database load
  response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");

  return applySessionCookies(sessionResponse, response);
}
