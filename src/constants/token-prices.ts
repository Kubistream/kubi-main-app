export const TOKEN_PRICES_USD: Record<string, number> = {
    "0x57b78b98b9dd06e06de145b83aedf6f04e4c5500": 2400, // WETHkb
    "0x1fe9a4e25caa2a22fc0b61010fdb0db462fb5b29": 1,    // USDCkb
    "0x5e1e8043381f3a21a1a64f46073daf7e74fedc1e": 1,    // USDTkb
    "0x06c1e044d5beb614faa6128001f519e6c693a044": 0.000067, // IDRXkb
    "0x80d27901053b1cd4adca21897558385a793e0092": 0.1,  // ASTERkb
    "0x455360debc0b144e38065234a860d4556c5d6445": 1.2,  // MANTAkb
    "0x2f79e1034c83947b52765a04c62a817f4a73341b": 65000, // Bitcoinkb
    "0x7392e9e58f202da3877776c41683ac457dfd4cd7": 2400, // ETHkb
    "0x3328022076881220148d5818d125edbf1e8fa450": 0.05, // PENGUkb
    "0x7a8ad6e64ee7298d5ab2a4617cc9bc121abd6a5d": 0.4,  // LUNAkb
    "0x22d5b0261adea67737ace9570704fbdd1a4eecba": 1200,  // BNBkb
};

// Helper to get price safely (case insensitive)
export function getTokenPrice(address: string | undefined): number {
    if (!address) return 0;
    return TOKEN_PRICES_USD[address.toLowerCase()] || 0;
}
