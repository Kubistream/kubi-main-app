export const EARNINGS_TIMEFRAMES = ["1D", "7D", "30D", "All"] as const;
export type EarningsTimeframe = (typeof EARNINGS_TIMEFRAMES)[number];

export const EARNINGS_CURRENCIES = ["USD", "IDR"] as const;
export type EarningsCurrency = (typeof EARNINGS_CURRENCIES)[number];

export type EarningsSparklinePoint = { t: number; v: string };

export type EarningsTokenSummary = {
  tokenId: string;
  symbol: string;
  name: string | null;
  logoURI: string | null;
  decimals: number;
  amount: string;
  fiatValue: string;
  growthPercent: number;
};

export type EarningsOverviewResponse = {
  primaryTotal: string;
  growthPercent: number;
  currency: EarningsCurrency;
  sparkline: EarningsSparklinePoint[];
  updatedAt: string;
  primaryToken: EarningsTokenSummary | null;
  tokenBreakdown: EarningsTokenSummary[];
};
