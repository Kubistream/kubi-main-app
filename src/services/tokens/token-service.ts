export type TokenDto = {
  id: string;
  chainId: number;
  address: string;
  symbol: string;
  name: string | null;
  decimals: number;
  isRepresentativeToken: boolean;
  logoURI?: string | null;
};

export async function fetchTokens(): Promise<TokenDto[]> {
  try {
    const res = await fetch("/api/tokens", { credentials: "include" });
    if (!res.ok) {
      console.error("fetchTokens failed with status:", res.status);
      return [];
    }
    const data = (await res.json()) as { tokens: TokenDto[] };
    return data.tokens ?? [];
  } catch (error) {
    console.error("fetchTokens encountered an error:", error);
    return [];
  }
}
