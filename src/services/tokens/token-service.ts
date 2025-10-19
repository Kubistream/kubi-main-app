export type TokenDto = {
  id: string;
  chainId: number;
  address: string;
  symbol: string;
  name: string | null;
  decimals: number;
  isNative: boolean;
  logoURI?: string | null;
};

export async function fetchTokens(): Promise<TokenDto[]> {
  const res = await fetch("/api/tokens", { credentials: "include" });
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as { tokens: TokenDto[] };
  return data.tokens ?? [];
}
