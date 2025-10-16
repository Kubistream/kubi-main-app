import Link from "next/link";
import { cookies } from "next/headers";
import { DonationStatus } from "@prisma/client";

import { findSessionByToken } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const BASESCAN_TX_URL = "https://sepolia.basescan.org/tx/";
const BASESCAN_BLOCK_URL = "https://sepolia.basescan.org/block/";
const SESSION_COOKIE_NAME = "kubi.session";
const MAX_ROWS = 200;
const RESET_PATH = "/dashboard/history";

type HistoryPageProps = {
  searchParams?: {
    status?: string;
    token?: string;
  };
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
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const sessionRecord = await findSessionByToken(sessionToken);

  const streamerId = sessionRecord?.user.streamer?.id ?? null;

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

  const rawStatus = searchParams?.status?.toUpperCase();
  const statusFilter = rawStatus && rawStatus !== "ALL" && Object.values(DonationStatus).includes(rawStatus as DonationStatus)
    ? (rawStatus as DonationStatus)
    : undefined;

  const tokenFilter = searchParams?.token && searchParams.token !== "all" ? searchParams.token : undefined;

  const [donations, tokenOptions] = await Promise.all([
    prisma.donation.findMany({
      where: {
        streamerId,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(tokenFilter ? { tokenInId: tokenFilter } : {}),
      },
      include: {
        tokenIn: {
          select: {
            id: true,
            symbol: true,
            name: true,
            logoURI: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
    }),
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
        <Filters
          statusOptions={STATUS_OPTIONS}
          tokenOptions={tokenFilterOptions}
          activeStatus={statusFilter ?? "all"}
          activeToken={tokenFilter ?? "all"}
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
                      {row.donorWallet ? shortenHash(row.donorWallet) : "—"}
                    </td>
                    <td className="py-4 pr-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-4 pr-3 font-mono text-slate-900">
                      {formatDecimal(row.amountInRaw)}
                    </td>
                    <td className="py-4 pr-3">
                      <TokenCell token={row.token} />
                    </td>
                    <td className="py-4 pr-3 font-mono text-slate-700">
                      {formatDecimal(row.feeRaw)}
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

        <p className="text-xs text-slate-500">
          Showing up to {MAX_ROWS} most recent donations. Need more history? Export endpoints are coming soon.
        </p>
      </section>
    </div>
  );
}

type FiltersProps = {
  statusOptions: Array<{ value: string; label: string }>;
  tokenOptions: Array<{ value: string; label: string }>;
  activeStatus: string;
  activeToken: string;
};

function Filters({ statusOptions, tokenOptions, activeStatus, activeToken }: FiltersProps) {
  return (
    <form
      method="get"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={activeStatus}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500" htmlFor="token">
          Token
        </label>
        <select
          id="token"
          name="token"
          defaultValue={activeToken}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
        >
          {tokenOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100"
        >
          Apply filters
        </button>
        <Link
          href={RESET_PATH}
          className="text-sm font-medium text-sky-600 transition hover:text-sky-700"
        >
          Reset
        </Link>
      </div>
    </form>
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
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

function formatDecimal(value: string | null) {
  if (!value) return "—";
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
