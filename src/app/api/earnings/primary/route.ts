import { NextRequest, NextResponse } from "next/server";

import { applySessionCookies, getAuthSession, resolveAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { EarningsCurrency, EarningsTimeframe, EarningsTokenSummary } from "@/types/earnings";
import { DonationStatus, Prisma } from "@prisma/client";

function parseTimeframe(input: string | null): EarningsTimeframe {
  if (input === "1D" || input === "7D" || input === "30D" || input === "All") return input;
  return "7D";
}

function parseCurrency(input: string | null): EarningsCurrency {
  if (input === "USD" || input === "IDR") return input;
  return "USD";
}

function getRangeForTimeframe(tf: EarningsTimeframe, now = new Date(), earliest?: Date | null) {
  if (tf === "All") {
    const normalized = earliest ? new Date(earliest) : null;
    return { from: normalized, to: now };
  }
  const to = now;
  const from = new Date(to);
  if (tf === "1D") from.setUTCDate(from.getUTCDate() - 1);
  else if (tf === "7D") from.setUTCDate(from.getUTCDate() - 7);
  else if (tf === "30D") from.setUTCDate(from.getUTCDate() - 30);
  return { from, to };
}

function getPrevRange(from: Date, to: Date) {
  const duration = to.getTime() - from.getTime();
  const prevTo = new Date(from);
  const prevFrom = new Date(from.getTime() - duration);
  return { prevFrom, prevTo };
}

function getBucketConfig(tf: EarningsTimeframe, range: { from: Date | null; to: Date }) {
  const to = range.to;
  if (tf === "1D") {
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
    return { from, to, bucketMs: 60 * 60 * 1000, buckets: 24 };
  }
  if (tf === "7D") {
    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from, to, bucketMs: 24 * 60 * 60 * 1000, buckets: 7 };
  }
  if (tf === "30D") {
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from, to, bucketMs: 24 * 60 * 60 * 1000, buckets: 30 };
  }
  // All: dynamic buckets up to 30 segments based on data range; fallback 30D if no data
  return null;
}

const ZERO_DECIMAL = new Prisma.Decimal(0);
const FIAT_DECIMALS: Record<EarningsCurrency, number> = {
  USD: 2,
  IDR: 0,
};

function toDecimal(val: unknown): Prisma.Decimal {
  if (val == null) return ZERO_DECIMAL;
  if (Prisma.Decimal.isDecimal(val)) return val;
  if (typeof val === "number" || typeof val === "string") {
    if (val === "") return ZERO_DECIMAL;
    return new Prisma.Decimal(val);
  }
  if (typeof val === "bigint") {
    return new Prisma.Decimal(val.toString());
  }
  return ZERO_DECIMAL;
}

function computeGrowthPercent(current: Prisma.Decimal, previous: Prisma.Decimal) {
  if (previous.equals(0)) {
    if (current.equals(0)) return 0;
    return current.greaterThan(0) ? 100 : 0;
  }
  const diff = current.sub(previous);
  const pct = diff.div(previous).mul(100);
  return Number(pct.toFixed(0));
}

export async function GET(request: NextRequest) {
  const { session, sessionResponse } = await getAuthSession(request);
  const sessionRecord = await resolveAuthenticatedUser(session);

  const url = new URL(request.url);
  const timeframe = parseTimeframe(url.searchParams.get("timeframe"));
  const currency = parseCurrency(url.searchParams.get("currency"));

  if (!sessionRecord || !sessionRecord.user.streamer) {
    const res = NextResponse.json(
      {
        primaryTotal: "0",
        growthPercent: 0,
        currency,
        sparkline: [],
        updatedAt: new Date().toISOString(),
        primaryToken: null,
        tokenBreakdown: [],
      },
      { status: 200 },
    );
    return applySessionCookies(sessionResponse, res);
  }

  const streamer = sessionRecord.user.streamer;
  const streamerId = streamer.id;

  const now = new Date();
  let range = getRangeForTimeframe(timeframe, now, streamer.profileCompletedAt ?? null);

  const amountField = currency === "USD" ? "amountInUsd" : "amountInIdr";

  const buildSparklineWhere = (inputRange: { from: Date | null; to: Date }): Prisma.DonationWhereInput => {
    const base: Prisma.DonationWhereInput = {
      streamerId,
      status: DonationStatus.CONFIRMED,
      [amountField]: { not: null },
    };
    if (inputRange.from) {
      base.timestamp = { gte: inputRange.from, lte: inputRange.to };
    } else {
      base.timestamp = { lte: inputRange.to };
    }
    return base;
  };

  const buildTokenGroupWhere = (inputRange: { from: Date | null; to: Date }): Prisma.DonationWhereInput => {
    const base: Prisma.DonationWhereInput = {
      streamerId,
      status: DonationStatus.CONFIRMED,
      [amountField]: { not: null },
      amountInRaw: { not: null },
    };
    if (inputRange.from) {
      base.timestamp = { gte: inputRange.from, lte: inputRange.to };
    } else {
      base.timestamp = { lte: inputRange.to };
    }
    return base;
  };

  const loadCurrentSnapshot = async (inputRange: { from: Date | null; to: Date }) => {
    const sparklineWhere = buildSparklineWhere(inputRange);
    const tokenWhere = buildTokenGroupWhere(inputRange);
    const [currentDonations, tokenGroups] = await Promise.all([
      prisma.donation.findMany({
        where: sparklineWhere,
        select: { timestamp: true, amountInUsd: true, amountInIdr: true },
        orderBy: { timestamp: "asc" },
      }),
      prisma.donation.groupBy({
        by: ["tokenInId"],
        where: tokenWhere,
        _sum: {
          amountInUsd: true,
          amountInIdr: true,
          amountInRaw: true,
        },
      }),
    ]);
    return { currentDonations, tokenGroups };
  };

  let { currentDonations: current, tokenGroups: currentTokenGroups } = await loadCurrentSnapshot(range);

  if (timeframe === "All" && range.from && current.length === 0) {
    range = getRangeForTimeframe(timeframe, now, null);
    ({ currentDonations: current, tokenGroups: currentTokenGroups } = await loadCurrentSnapshot(range));
  }

  // Sum current total
  let currentTotal = new Prisma.Decimal(0);
  for (const d of current) {
    const val = currency === "USD" ? d.amountInUsd : d.amountInIdr;
    if (val != null) currentTotal = currentTotal.add(toDecimal(val));
  }

  // Growth percent (skip for All)
  let growthPercent = 0;
  let previousTokenMap = new Map<string, { fiat: Prisma.Decimal; raw: Prisma.Decimal }>();
  if (timeframe !== "All" && range.from) {
    const { prevFrom, prevTo } = getPrevRange(range.from, range.to);
    const previous = await prisma.donation.findMany({
      where: {
        streamerId,
        status: DonationStatus.CONFIRMED,
        timestamp: { gte: prevFrom, lt: prevTo }, // exclude boundary to avoid double count
        [amountField]: { not: null },
      },
      select: { amountInUsd: true, amountInIdr: true },
    });
    let prevTotal = new Prisma.Decimal(0);
    for (const d of previous) {
      const val = currency === "USD" ? d.amountInUsd : d.amountInIdr;
      if (val != null) prevTotal = prevTotal.add(toDecimal(val));
    }
    const previousTokenGroups = await prisma.donation.groupBy({
      by: ["tokenInId"],
      where: {
        streamerId,
        status: DonationStatus.CONFIRMED,
        timestamp: { gte: prevFrom, lt: prevTo },
        [amountField]: { not: null },
        amountInRaw: { not: null },
      },
      _sum: {
        amountInUsd: true,
        amountInIdr: true,
        amountInRaw: true,
      },
    });
    previousTokenMap = new Map(
      previousTokenGroups
        .filter((group) => Boolean(group.tokenInId))
        .map((group) => {
          const tokenId = group.tokenInId as string;
          return [
            tokenId,
            {
              fiat: toDecimal(
                currency === "USD" ? group._sum.amountInUsd : group._sum.amountInIdr,
              ),
              raw: toDecimal(group._sum.amountInRaw),
            },
          ];
        }),
    );

    growthPercent = computeGrowthPercent(currentTotal, prevTotal);
  }

  const primaryTokenId = sessionRecord.user.streamer.primaryTokenId ?? null;

  const tokenIds = new Set<string>();
  for (const group of currentTokenGroups) {
    if (group.tokenInId) {
      tokenIds.add(group.tokenInId);
    }
  }
  if (primaryTokenId) {
    tokenIds.add(primaryTokenId);
  }

  const tokenRecords = tokenIds.size > 0
    ? await prisma.token.findMany({
        where: { id: { in: Array.from(tokenIds) } },
        select: { id: true, symbol: true, name: true, logoURI: true, decimals: true },
      })
    : [];

  const tokenMetaMap = new Map(
    tokenRecords.map((token) => [token.id, token]),
  );

  type TokenAggregate = {
    tokenId: string;
    fiatSum: Prisma.Decimal;
    tokenSum: Prisma.Decimal;
    growthPercent: number;
    meta: {
      symbol: string;
      name: string | null;
      logoURI: string | null;
      decimals: number;
    };
  };

  const tokenAggregates: TokenAggregate[] = [];
  for (const group of currentTokenGroups) {
    const tokenId = group.tokenInId;
    if (!tokenId) continue;
    const meta = tokenMetaMap.get(tokenId);
    if (!meta) continue;
    const fiatSum = currency === "USD"
      ? toDecimal(group._sum.amountInUsd)
      : toDecimal(group._sum.amountInIdr);
    const tokenSum = toDecimal(group._sum.amountInRaw);
    const previous = previousTokenMap.get(tokenId);
    const previousFiat = previous?.fiat ?? ZERO_DECIMAL;
    tokenAggregates.push({
      tokenId,
      fiatSum,
      tokenSum,
      growthPercent: computeGrowthPercent(fiatSum, previousFiat),
      meta: {
        symbol: meta.symbol,
        name: meta.name,
        logoURI: meta.logoURI,
        decimals: meta.decimals,
      },
    });
  }

  const sortedTokenAggregates = [...tokenAggregates].sort((a, b) => b.fiatSum.cmp(a.fiatSum));

  let primaryTokenSummary: EarningsTokenSummary | null = null;
  if (primaryTokenId) {
    const meta = tokenMetaMap.get(primaryTokenId);
    if (meta) {
      const aggregate = tokenAggregates.find((entry) => entry.tokenId === primaryTokenId);
      const previous = previousTokenMap.get(primaryTokenId);
      const currentFiat = aggregate ? aggregate.fiatSum : ZERO_DECIMAL;
      const currentTokenSum = aggregate ? aggregate.tokenSum : ZERO_DECIMAL;
      const prevFiat = previous?.fiat ?? ZERO_DECIMAL;
      const growth = aggregate ? aggregate.growthPercent : computeGrowthPercent(currentFiat, prevFiat);
      primaryTokenSummary = {
        tokenId: primaryTokenId,
        symbol: meta.symbol,
        name: meta.name,
        logoURI: meta.logoURI,
        decimals: meta.decimals,
        amount: currentTokenSum.toFixed(0),
        fiatValue: currentFiat.toFixed(FIAT_DECIMALS[currency]),
        growthPercent: growth,
      };
    }
  }

  const tokenBreakdown: EarningsTokenSummary[] = sortedTokenAggregates
    .filter((entry) => entry.tokenId !== primaryTokenId)
    .map((entry) => ({
      tokenId: entry.tokenId,
      symbol: entry.meta.symbol,
      name: entry.meta.name,
      logoURI: entry.meta.logoURI,
      decimals: entry.meta.decimals,
      amount: entry.tokenSum.toFixed(0),
      fiatValue: entry.fiatSum.toFixed(FIAT_DECIMALS[currency]),
      growthPercent: entry.growthPercent,
    }));

  // Sparkline bucketing
  let buckets: Array<{ t: number; v: string }> = [];
  const cfg = getBucketConfig(timeframe, range);
  if (cfg) {
    const { from, to, bucketMs, buckets: count } = cfg;
    // Ensure from/to cover current donations
    const starts: number[] = Array.from({ length: count }, (_, i) => from.getTime() + i * bucketMs);
    const sums = Array.from({ length: count }, () => new Prisma.Decimal(0));
    for (const d of current) {
      const ts = new Date(d.timestamp).getTime();
      if (ts < from.getTime() || ts > to.getTime()) continue;
      const b = Math.min(Math.floor((ts - from.getTime()) / bucketMs), count - 1);
      const val = currency === "USD" ? d.amountInUsd : d.amountInIdr;
      if (val !== null && val !== undefined) sums[b] = sums[b]!.add(toDecimal(val));
    }
    buckets = sums.map((v, i) => ({
      t: starts[i],
      v: v.toFixed(FIAT_DECIMALS[currency]),
    }));
  } else {
    // All: dynamic up to 30 buckets over available data range
    if (current.length === 0) {
      buckets = [];
    } else {
      const earliest = current[0]!.timestamp;
      const startMs = new Date(earliest).getTime();
      const endMs = now.getTime();
      const maxBuckets = 30;
      const span = Math.max(endMs - startMs, 1);
      const bucketMs = Math.ceil(span / maxBuckets);
      const count = Math.min(maxBuckets, Math.max(1, Math.ceil(span / bucketMs)));
      const starts: number[] = Array.from({ length: count }, (_, i) => startMs + i * bucketMs);
      const sums = Array.from({ length: count }, () => new Prisma.Decimal(0));
      for (const d of current) {
        const ts = new Date(d.timestamp).getTime();
        const b = Math.min(Math.floor((ts - startMs) / bucketMs), count - 1);
        const val = currency === "USD" ? d.amountInUsd : d.amountInIdr;
        if (val !== null && val !== undefined) sums[b] = sums[b]!.add(toDecimal(val));
      }
      buckets = sums.map((v, i) => ({
        t: starts[i],
        v: v.toFixed(FIAT_DECIMALS[currency]),
      }));
    }
  }

  const res = NextResponse.json({
    primaryTotal: currentTotal.toFixed(FIAT_DECIMALS[currency]),
    growthPercent,
    currency,
    sparkline: buckets,
    updatedAt: now.toISOString(),
    primaryToken: primaryTokenSummary,
    tokenBreakdown,
  });
  return applySessionCookies(sessionResponse, res);
}
