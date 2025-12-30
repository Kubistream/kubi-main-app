import Link from "next/link";
import { cookies } from "next/headers";
import { DonationStatus, type Prisma } from "@prisma/client";
import { formatTokenAmount as formatDisplayTokenAmount } from "@/lib/format/token-amount";

import { HistoryFilters } from "@/components/features/dashboard/history-filters";
import { HistoryPagination } from "@/components/features/dashboard/history-pagination";
import { HistoryRowAction } from "@/components/features/dashboard/history-row-action";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

// Fallback if not generated yet
type MediaType = "TEXT" | "AUDIO" | "VIDEO";
const MediaType = {
  TEXT: "TEXT",
  AUDIO: "AUDIO",
  VIDEO: "VIDEO"
} as const;

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



const STATUS_OPTIONS = [{ value: "all", label: "All statuses" }].concat(
  Object.values(DonationStatus).map((status) => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase(),
  })),
);

// Consolidated HistoryRow type
type HistoryRow = {
  id: string;
  txHash: string;
  blockNumber: number;
  donorWallet: string | null;
  donorName?: string | null;
  status: DonationStatus;
  amountInRaw: string | null;
  amountOutRaw: string | null;
  tokenIn: {
    id: string;
    symbol: string;
    name: string | null;
    logoURI: string | null;
    decimals: number;
  };
  tokenOut: {
    id: string;
    symbol: string;
    name: string | null;
    logoURI: string | null;
    decimals: number;
  };
  feeRaw: string | null;
  createdAt: string;
  mediaType?: MediaType;
  message?: string | null;
  mediaUrl?: string | null;
  mediaDuration?: number | null;
};

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
          <p className="text-xs font-black uppercase tracking-widest text-accent-cyan">Transaction history</p>
          <h1 className="mt-3 text-3xl font-black text-white font-display">All your payouts in one place</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Sign in as a streamer to review your latest donations and on-chain settlements.
          </p>
        </header>

        <div className="rounded-2xl border-2 border-[var(--color-border-dark)] bg-surface-dark px-8 py-12 text-center shadow-fun">
          <p className="text-sm text-slate-400">
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
      tokenOut: {
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

  // Fetch donor names
  const donorWallets = [...new Set(donations.map((d) => d.donorWallet).filter((w): w is string => !!w))];
  const donors = await prisma.user.findMany({
    where: {
      wallet: { in: donorWallets, mode: "insensitive" },
    },
    select: {
      wallet: true,
      displayName: true,
    },
  });

  const donorMap = new Map(donors.map((d) => [d.wallet.toLowerCase(), d.displayName]));

  const rows: HistoryRow[] = donations.map((donation) => ({
    id: donation.id,
    txHash: donation.txHash,
    blockNumber: donation.blockNumber,
    donorWallet: donation.donorWallet,
    donorName: donation.donorWallet ? donorMap.get(donation.donorWallet.toLowerCase()) : null,
    status: donation.status,
    amountInRaw: donation.amountInRaw
      ? donation.amountInRaw.toFixed(donation.amountInRaw.decimalPlaces())
      : null,
    amountOutRaw: donation.amountOutRaw
      ? donation.amountOutRaw.toFixed(donation.amountOutRaw.decimalPlaces())
      : null,
    tokenIn: {
      id: donation.tokenIn.id,
      symbol: donation.tokenIn.symbol,
      name: donation.tokenIn.name ?? null,
      logoURI: donation.tokenIn.logoURI ?? null,
      decimals: donation.tokenIn.decimals,
    },
    tokenOut: {
      id: donation.tokenOut.id,
      symbol: donation.tokenOut.symbol,
      name: donation.tokenOut.name ?? null,
      logoURI: donation.tokenOut.logoURI ?? null,
      decimals: donation.tokenOut.decimals,
    },
    feeRaw: donation.feeRaw
      ? donation.feeRaw.toFixed(donation.feeRaw.decimalPlaces())
      : null,
    createdAt: donation.createdAt.toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mediaType: (donation as any).mediaType,
    message: donation.message,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mediaUrl: (donation as any).mediaUrl,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mediaDuration: (donation as any).mediaDuration,
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
        <p className="text-xs font-black uppercase tracking-widest text-accent-cyan">Transaction history</p>
        <h1 className="mt-3 text-3xl font-black text-white font-display">All your donations in one place</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Monitor live on-chain donations, confirm settlement details, and jump directly to Base Sepolia for full
          transaction context.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border-2 border-[var(--color-border-dark)] bg-surface-dark px-6 py-6 shadow-fun sm:px-8">
        <HistoryFilters
          statusOptions={STATUS_OPTIONS}
          tokenOptions={tokenFilterOptions}
          resetPath={RESET_PATH}
        />

        <div className="overflow-x-auto rounded-xl border border-[var(--color-border-dark)]">
          <table className="w-full min-w-[1100px] divide-y divide-[var(--color-border-dark)] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-slate-500 font-display font-bold">
                <th className="py-3 px-4">Tx hash</th>
                <th className="py-3 px-3">From</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Donor Sent</th>
                <th className="py-3 px-3">Received</th>
                <th className="py-3 px-3">Fee</th>
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Message</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-dark)]/50 text-sm">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-slate-500">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="align-middle hover:bg-white/5 transition-colors border-b border-[var(--color-border-dark)]/50 last:border-0">
                    <td className="py-4 px-4 font-mono">
                      <Link
                        href={`${BASESCAN_TX_URL}${row.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-accent-cyan transition hover:text-primary"
                      >
                        <span>{shortenHash(row.txHash)}</span>
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </Link>
                    </td>
                    <td className="py-4 px-3 font-medium text-white">
                      {row.donorName ? (
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{row.donorName}</span>
                          {row.donorWallet && (
                            <span className="text-xs text-slate-500 font-mono">{shortenHash(row.donorWallet)}</span>
                          )}
                        </div>
                      ) : (
                        <span className="font-mono text-slate-300">
                          {row.donorWallet ? shortenHash(row.donorWallet) : "Anonymous"}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-4 px-3 align-top">
                      <TokenAmountCell amountRaw={row.amountInRaw} token={row.tokenIn} />
                    </td>
                    <td className="py-4 px-3 align-top">
                      <TokenAmountCell amountRaw={row.amountOutRaw} token={row.tokenOut} />
                    </td>
                    <td className="py-4 px-3 font-mono text-slate-400">
                      {formatDonationAmount(row.feeRaw, row.tokenIn.decimals)}
                    </td>
                    <td className="py-4 px-3">
                      <time
                        className="text-sm text-slate-400"
                        dateTime={row.createdAt}
                        title={formatAbsolute(row.createdAt)}
                      >
                        {formatRelativeTime(row.createdAt)}
                      </time>
                    </td>
                    <td className="py-4 px-3">
                      {row.mediaType === "TEXT" && row.message ? (
                        <span className="truncate max-w-[200px] inline-block text-slate-300" title={row.message}>
                          {row.message}
                        </span>
                      ) : row.mediaType === "AUDIO" ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs font-bold uppercase tracking-wide">
                          <span className="material-symbols-outlined text-sm">mic</span>
                          Audio
                        </div>
                      ) : row.mediaType === "VIDEO" ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-500 text-xs font-bold uppercase tracking-wide">
                          <span className="material-symbols-outlined text-sm">movie</span>
                          Video
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-right">
                      <HistoryRowAction row={row} />
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
              ? `Showing ${firstRow}-${lastRow} of ${totalCount} donations | Page ${page} of ${totalPages}`
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
      className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider border"
      style={{
        backgroundColor: meta.background,
        color: meta.foreground,
        borderColor: meta.border,
      }}
    >
      {meta.label}
    </span>
  );
}

function TokenAmountCell({
  amountRaw,
  token,
}: {
  amountRaw: string | null;
  token: { symbol: string; name: string | null; logoURI: string | null; decimals: number };
}) {
  const label = token.name ?? token.symbol;
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      {token.logoURI ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote token logos may not be whitelisted for next/image
        <img
          src={token.logoURI}
          alt={label}
          className="h-8 w-8 rounded-full object-cover border border-[var(--color-border-dark)]"
          loading="lazy"
        />
      ) : (
        <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-border-dark)] text-[0.75rem] font-bold text-white">
          {token.symbol.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="font-mono text-sm font-bold text-white">
          {formatDonationAmount(amountRaw, token.decimals)}
        </span>
        <span className="truncate text-xs text-slate-500">
          {token.symbol}
        </span>
      </div>
    </div>
  );
}

function getStatusMeta(status: DonationStatus) {
  switch (status) {
    case DonationStatus.CONFIRMED:
      return { label: "Confirmed", background: "rgba(6, 214, 160, 0.1)", foreground: "var(--color-accent-cyan)", border: "rgba(6, 214, 160, 0.3)" };
    case DonationStatus.PENDING:
      return { label: "Pending", background: "rgba(255, 209, 102, 0.1)", foreground: "var(--color-secondary)", border: "rgba(255, 209, 102, 0.3)" };
    case DonationStatus.ORPHANED:
      return { label: "Orphaned", background: "rgba(247, 120, 186, 0.1)", foreground: "var(--color-primary)", border: "rgba(247, 120, 186, 0.3)" };
    default:
      return { label: status, background: "rgba(45, 36, 82, 0.5)", foreground: "#94A3B8", border: "var(--color-border-dark)" };
  }
}

function shortenHash(value: string, lead = 6, tail = 4) {
  if (value.length <= lead + tail + 3) return value;
  return `${value.slice(0, lead)}...${value.slice(-tail)}`;
}

function formatDonationAmount(value: string | null, decimals: number) {
  if (!value) return "--";
  return formatDisplayTokenAmount(value, decimals);
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
