// Token prices in USD for Kubi tokens
// Calculated from MockSwapRouter exchange rates (setup-mock-router.sh)
// Base: ETH = $2500, all rates relative to ETH
export const TOKEN_PRICES_USD: Record<string, number> = {
    // Kubi tokens (same addresses on all chains)
    "0x33c6f26da09502e6540043f030ae1f87f109cc99": 75,      // MNT (0.03 ETH × $2500)
    "0x7cb382ce1aa40fa9f9a59a632090c05dc28cae7b": 2500,    // ETH (1 ETH × $2500)
    "0xb288ba5b5b80dd0fd83541ef2e5922f71121fa13": 1,       // USDC (0.0004 ETH × $2500)
    "0xc4a53c466cfb62aeced03008b0162baaf36e0b03": 1,       // USDT (0.0004 ETH × $2500)
    "0x70db6efb75c898ad1e194fda2b8c6e73dbc944d6": 0.25,    // PUFF (0.0001 ETH × $2500)
    "0xee589fbf85128aba6f42696db2f28ea9ebdde173": 0.75,    // AXL (0.0003 ETH × $2500)
    "0x2c036be74942c597e4d81d7050008ddc11becceb": 0.50,    // SVL (0.0002 ETH × $2500)
    "0x90cdcbf4c4bc78dc440252211efd744d0a4dc4a1": 14,      // LINK (0.0056 ETH × $2500)
    "0xced6ceb47301f268d57ff07879df45fda80e6974": 40000,   // WBTC (16 ETH × $2500)
    "0x782ba48189af93a0cf42766058de83291f384bf3": 5,       // PENDLE (0.002 ETH × $2500)
};

// Helper to get price safely (case insensitive)
export function getTokenPrice(address: string | undefined): number {
    if (!address) return 0;
    return TOKEN_PRICES_USD[address.toLowerCase()] || 0;
}

