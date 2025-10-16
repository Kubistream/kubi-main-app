import Link from "next/link";
import { cookies } from "next/headers";
import { DonationStatus, type Prisma } from "@prisma/client";
import { formatUnits } from "ethers";

import { HistoryFilters } from "@/components/features/dashboard/history-filters";
import { HistoryPagination } from "@/components/features/dashboard/history-pagination";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const BASESCAN_TX_URL = "https://sepolia.basescan.org/tx/";
const BASESCAN_BLOCK_URL = "https://sepolia.basescan.org/block/";
const BASESCAN_ADDRESS_URL = "https://sepolia.basescan.org/address/";
const RESET_PATH = "/dashboard/history";
const API_TIMEOUT_MS = 4000;
const LOCAL_FALLBACK_URL = "http://localhost:3000";
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

type HistoryPageProps = {
  searchParams?: Promise<{
    status?: string | string[];
    token?: string | string[];
    page?: string | string[];
    pageSize?: string | string[];
  }>;
};

type HistoryRow = {
  id: string;
  txHash: string;
  blockNumber: number;
  donorWallet: string | null;
  status: DonationStatus;
  amountInRaw: string | null;
  token: {
    id: string;
    symbol: string;
    name: string | null;
    logoURI: string | null;
    decimals: number;
  };
  feeRaw: string | null;
  createdAt: string;
};

const STATUS_OPTIONS = [{ value: "all", label: "All statuses" }].concat(
  Object.values(DonationStatus).map((status) => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase(),
  })),
);

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const streamerId = cookieHeader ? await resolveStreamerId(cookieHeader) : null;

  if (!streamerId) {
    return (
      <div className="space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-400">Transaction history</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">All your payouts in one place</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Sign in as a streamer to review your latest donations and on-chain settlements.
          </p>
        </header>

        <div className="rounded-3xl border border-white/60 bg-white/95 px-8 py-12 text-center shadow-[0_18px_32px_-26px_rgba(2,6,23,0.35)]">
          <p className="text-sm text-slate-600">
            We couldn&apos;t resolve your streamer profile. Please sign in again, or finish onboarding to unlock transaction
            history.
          </p>
        </div>
      </div>
    );
  }

  const params = searchParams ? await searchParams : undefined;
  const statusParam = pickFirst(params?.status)?.toUpperCase();
  const statusFilter =
    statusParam && statusParam !== "ALL" && Object.values(DonationStatus).includes(statusParam as DonationStatus)
      ? (statusParam as DonationStatus)
      : undefined;

  const tokenParam = pickFirst(params?.token);
  const tokenFilter = tokenParam && tokenParam !== "all" ? tokenParam : undefined;

  const rawPage = Number.parseInt(pickFirst(params?.page) ?? "1", 10);
  const parsedPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawPageSize = Number.parseInt(pickFirst(params?.pageSize) ?? String(DEFAULT_PAGE_SIZE), 10);
  const pageSize = PAGE_SIZE_OPTIONS.find((option) => option === rawPageSize) ?? DEFAULT_PAGE_SIZE;

  const where: Prisma.DonationWhereInput = {
    streamerId,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(tokenFilter ? { tokenInId: tokenFilter } : {}),
  };

  const [totalCount, tokenOptions] = await Promise.all([
    prisma.donation.count({ where }),
    prisma.token.findMany({
      where: {
        donationsIn: {
          some: {
            streamerId,
          },
        },
      },
      select: {
        id: true,
        symbol: true,
        name: true,
      },
      orderBy: { symbol: "asc" },
    }),
  ]);

  const totalPages = totalCount === 0 ? 1 : Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(parsedPage, totalPages);
  const skip = (page - 1) * pageSize;

  const donations = await prisma.donation.findMany({
    where,
    include: {
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
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
  });

  const rows: HistoryRow[] = donations.map((donation) => ({
    id: donation.id,
    txHash: donation.txHash,
    blockNumber: donation.blockNumber,
    donorWallet: donation.donorWallet,
    status: donation.status,
    amountInRaw: donation.amountInRaw?.toString() ?? null,
    token: {
      id: donation.tokenIn.id,
      symbol: donation.tokenIn.symbol,
      name: donation.tokenIn.name ?? null,
      logoURI: donation.tokenIn.logoURI ?? null,
      decimals: donation.tokenIn.decimals,
    },
    feeRaw: donation.feeRaw?.toString() ?? null,
    createdAt: donation.createdAt.toISOString(),
  }));

  const tokenFilterOptions = [
    { value: "all", label: "All tokens" },
    ...tokenOptions.map((token) => ({
      value: token.id,
      label: token.name ? `${token.symbol} (${token.name})` : token.symbol,
    })),
  ];

  const hasDonations = totalCount > 0;
  const firstRow = hasDonations ? skip + 1 : 0;
  const lastRow = hasDonations ? skip + rows.length : 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-400">Transaction history</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">All your donations in one place</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Monitor live on-chain donations, confirm settlement details, and jump directly to Base Sepolia for full
          transaction context.
        </p>
      </header>

      <section className="space-y-4 rounded-3xl border border-white/60 bg-white/95 px-6 py-6 shadow-[0_18px_32px_-26px_rgba(2,6,23,0.35)] sm:px-8">
        <HistoryFilters
          statusOptions={STATUS_OPTIONS}
          tokenOptions={tokenFilterOptions}
          resetPath={RESET_PATH}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                <th className="py-3 pr-3">Tx hash</th>
                <th className="py-3 pr-3">Block</th>
                <th className="py-3 pr-3">From</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Amount</th>
                <th className="py-3 pr-3">Token</th>
                <th className="py-3 pr-3">Fee</th>
                <th className="py-3 pr-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-500">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="align-middle">
                    <td className="py-4 pr-3 font-mono">
                      <Link
                        href={`${BASESCAN_TX_URL}${row.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 transition hover:text-sky-700"
                      >
                        {shortenHash(row.txHash)}
                      </Link>
                    </td>
                    <td className="py-4 pr-3 font-mono">
                      <Link
                        href={`${BASESCAN_BLOCK_URL}${row.blockNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 transition hover:text-sky-700"
                      >
                        {row.blockNumber}
                      </Link>
                    </td>
                    <td className="py-4 pr-3 font-mono text-slate-700">
                      {row.donorWallet ? (
                        <Link
                          href={`${BASESCAN_ADDRESS_URL}${row.donorWallet}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 transition hover:text-sky-700"
                        >
                          {shortenHash(row.donorWallet)}
                        </Link>
                      ) : (
                        "â€”"
                      )}
                    </td>
                    <td className="py-4 pr-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-4 pr-3 font-mono text-slate-900">
                      {formatTokenAmount(row.amountInRaw, row.token.decimals)}
                    </td>
                    <td className="py-4 pr-3">
                      <TokenCell token={row.token} />
                    </td>
                    <td className="py-4 pr-3 font-mono text-slate-700">
                      {formatTokenAmount(row.feeRaw, row.token.decimals)}
                    </td>
                    <td className="py-4 pr-3">
                      <time
                        className="text-sm text-slate-600"
                        dateTime={row.createdAt}
                        title={formatAbsolute(row.createdAt)}
                      >
                        {formatRelativeTime(row.createdAt)}
                      </time>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-500">
            {hasDonations
              ? `Showing ${firstRow}–${lastRow} of ${totalCount} donations • Page ${page} of ${totalPages}`
              : "No donations to display"}
          </p>
          <HistoryPagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            defaultPageSize={DEFAULT_PAGE_SIZE}
            resetPath={RESET_PATH}
          />
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: DonationStatus }) {
  const meta = getStatusMeta(status);
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
      style={{
        backgroundColor: meta.background,
        color: meta.foreground,
      }}
    >
      {meta.label}
    </span>
  );
}

function TokenCell({
  token,
}: {
  token: { symbol: string; name: string | null; logoURI: string | null };
}) {
  const label = token.name ?? token.symbol;
  return (
    <div className="flex items-center gap-2 text-sm text-slate-700">
      {token.logoURI ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote token logos may not be whitelisted for next/image
        <img
          src={token.logoURI}
          alt={label}
          className="h-6 w-6 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-[0.7rem] font-semibold text-slate-600">
          {token.symbol.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex flex-col">
        <span className="font-medium text-slate-900">{token.symbol}</span>
        {token.name && <span className="text-xs text-slate-500">{token.name}</span>}
      </div>
    </div>
  );
}

function getStatusMeta(status: DonationStatus) {
  switch (status) {
    case DonationStatus.CONFIRMED:
      return { label: "Confirmed", background: "#DCFCE7", foreground: "#047857" };
    case DonationStatus.PENDING:
      return { label: "Pending", background: "#FEF3C7", foreground: "#92400E" };
    case DonationStatus.ORPHANED:
      return { label: "Orphaned", background: "#FEE2E2", foreground: "#B91C1C" };
    default:
      return { label: status, background: "#E2E8F0", foreground: "#475569" };
  }
}

function shortenHash(value: string, lead = 6, tail = 4) {
  if (value.length <= lead + tail + 3) return value;
  return `${value.slice(0, lead)}â€¦${value.slice(-tail)}`;
}

function formatTokenAmount(value: string | null, decimals: number) {
  if (!value) return "â€”";
  try {
    const formatted = formatUnits(value, decimals);
    const [whole, fraction = ""] = formatted.split(".");
    const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const trimmedFraction = fraction.slice(0, Math.min(decimals, 16)).replace(/0+$/, "");
    return trimmedFraction ? `${groupedWhole}.${trimmedFraction}` : groupedWhole;
  } catch {
    return formatDecimal(value);
  }
}

function formatDecimal(value: string | null) {
  if (!value) return "â€”";
  const [whole, fraction] = value.split(".");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (!fraction) return groupedWhole;
  const trimmedFraction = fraction.replace(/0+$/, "");
  return trimmedFraction ? `${groupedWhole}.${trimmedFraction}` : groupedWhole;
}

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  if (diffMs < MINUTE) return "just now";
  if (diffMs < HOUR) {
    const minutes = Math.round(diffMs / MINUTE);
    return `${minutes} min ago`;
  }
  if (diffMs < DAY) {
    const hours = Math.round(diffMs / HOUR);
    return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  }
  if (diffMs < MONTH) {
    const days = Math.round(diffMs / DAY);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  if (diffMs < YEAR) {
    const months = Math.round(diffMs / MONTH);
    return `${months} mo${months > 1 ? "s" : ""} ago`;
  }
  const years = Math.round(diffMs / YEAR);
  return `${years} yr${years > 1 ? "s" : ""} ago`;
}

function formatAbsolute(iso: string) {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

async function resolveStreamerId(cookieHeader: string): Promise<string | null> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? env.APP_URL ?? LOCAL_FALLBACK_URL;
  if (!baseUrl) return null;

  const normalizedBase = baseUrl.replace(/\/+$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(`${normalizedBase}/api/streamers/me`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      streamer?: { id?: string | null } | null;
    };

    return data.streamer?.id ?? null;
  } catch (error) {
    console.error("Failed to resolve streamer context for history page", error);
    return null;
  }
}

function pickFirst(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

