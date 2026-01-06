import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mantle Sepolia: 5003
const MANTLE_SEPOLIA_CHAIN_ID = 5003;

// Underlying token addresses (these should already exist in the Token table)
const UNDERLYING_TOKENS = {
    USDC: "0xB288Ba5B5b80Dd0Fd83541ef2e5922f71121Fa13",
    USDT: "0xC4a53c466Cfb62AecED03008B0162baaf36E0B03",
    MNT: "0x33c6f26dA09502E6540043f030aE1F87f109cc99",
    BTC: "0xced6Ceb47301F268d57fF07879DF45Fda80e6974",
    ETH: "0x7CB382Ce1AA40FA9F9A59a632090c05Dc28caE7b",
};

// Protocol vaults (for reference - used in extraData)
const VAULTS = {
    MINTEREST: "0x2c753262eb9e627BD5dD870a9a74753774309644",
    LENDLE: "0x70e6e251099D5FAfcC301c255f447B3773aCD64d",
    INIT_CAPITAL: "0x9B8a0Bd4e61013b167D659d12B0b53883C91FC2E",
    COMPOUND: "0x412Bb24ad36f2C1A706DeD567b9ae87ECCB2EAb1",
};

// Yield tokens with their details
const YIELD_TOKENS = [
    // Minterest Protocol
    {
        symbol: "miUSDC",
        name: "Minterest Staked USDC",
        address: "0x2007Cb1a90E71c18983F1d4091261816E9e9c2dA",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.USDC,
        protocol: "minterest",
        protocolName: "Minterest",
        vault: VAULTS.MINTEREST,
    },
    {
        symbol: "miUSDT",
        name: "Minterest Staked USDT",
        address: "0x04F0aEf9cb921A8Ad848FA8B49aF7fc2E60DbcCb",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.USDT,
        protocol: "minterest",
        protocolName: "Minterest",
        vault: VAULTS.MINTEREST,
    },
    {
        symbol: "miMNT",
        name: "Minterest Staked MNT",
        address: "0x8c2B7136dDaF6129cE33f58d3E5475a0ed3F7b3C",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.MNT,
        protocol: "minterest",
        protocolName: "Minterest",
        vault: VAULTS.MINTEREST,
    },
    {
        symbol: "miBTC",
        name: "Minterest Staked BTC",
        address: "0x8e0dCfecDEEBb1da38DD1bbE9418FD7a4bdd4922",
        decimals: 8,
        underlying: UNDERLYING_TOKENS.BTC,
        protocol: "minterest",
        protocolName: "Minterest",
        vault: VAULTS.MINTEREST,
    },
    {
        symbol: "miETH",
        name: "Minterest Staked ETH",
        address: "0x89C0fa2BAE88752eC733922daa0c2Ff321bb5279",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.ETH,
        protocol: "minterest",
        protocolName: "Minterest",
        vault: VAULTS.MINTEREST,
    },
    // Lendle Protocol
    {
        symbol: "leUSDC",
        name: "Lendle Staked USDC",
        address: "0xa6c9dD702B198Da46f9C5b21bBe65a2a31fdEB63",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.USDC,
        protocol: "lendle",
        protocolName: "Lendle",
        vault: VAULTS.LENDLE,
    },
    {
        symbol: "leUSDT",
        name: "Lendle Staked USDT",
        address: "0x5c8b8caa55Af0d10ACc3ec95A614d26C90BD9b62",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.USDT,
        protocol: "lendle",
        protocolName: "Lendle",
        vault: VAULTS.LENDLE,
    },
    {
        symbol: "leMNT",
        name: "Lendle Staked MNT",
        address: "0xfCbFBaf16A7b392F5963232fC3d7bb81238a4Fc1",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.MNT,
        protocol: "lendle",
        protocolName: "Lendle",
        vault: VAULTS.LENDLE,
    },
    {
        symbol: "leBTC",
        name: "Lendle Staked BTC",
        address: "0x0dF313cE12b511062eCe811e435F0729E7c9746f",
        decimals: 8,
        underlying: UNDERLYING_TOKENS.BTC,
        protocol: "lendle",
        protocolName: "Lendle",
        vault: VAULTS.LENDLE,
    },
    {
        symbol: "leETH",
        name: "Lendle Staked ETH",
        address: "0xB1eF139d2f4D56B126196D9FF712b67e120c0349",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.ETH,
        protocol: "lendle",
        protocolName: "Lendle",
        vault: VAULTS.LENDLE,
    },
    // INIT Capital Protocol
    {
        symbol: "aaUSDC",
        name: "INIT Capital Staked USDC",
        address: "0x324Db0D78D0225431A2bD49470018b322a006833",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.USDC,
        protocol: "init-capital",
        protocolName: "INIT Capital",
        vault: VAULTS.INIT_CAPITAL,
    },
    {
        symbol: "aaUSDT",
        name: "INIT Capital Staked USDT",
        address: "0xbF1dC15Eaa6449d5bf81463578808313F5e208Ee",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.USDT,
        protocol: "init-capital",
        protocolName: "INIT Capital",
        vault: VAULTS.INIT_CAPITAL,
    },
    {
        symbol: "aaMNT",
        name: "INIT Capital Staked MNT",
        address: "0xc79F99285A0f4B640c552090eEab8CAbc4433C1D",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.MNT,
        protocol: "init-capital",
        protocolName: "INIT Capital",
        vault: VAULTS.INIT_CAPITAL,
    },
    {
        symbol: "aaBTC",
        name: "INIT Capital Staked BTC",
        address: "0xA5FC97D4eEE36Cf0CF5beE22cF78e74cE9882E81",
        decimals: 8,
        underlying: UNDERLYING_TOKENS.BTC,
        protocol: "init-capital",
        protocolName: "INIT Capital",
        vault: VAULTS.INIT_CAPITAL,
    },
    {
        symbol: "aaETH",
        name: "INIT Capital Staked ETH",
        address: "0xdf3eBc828195ffBc71bB80c467cF70BfDEf0AC1E",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.ETH,
        protocol: "init-capital",
        protocolName: "INIT Capital",
        vault: VAULTS.INIT_CAPITAL,
    },
    // Compound Protocol
    {
        symbol: "coUSDC",
        name: "Compound Staked USDC",
        address: "0x8edafBaDe92450979DfF2F10449E7917c722AF50",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.USDC,
        protocol: "compound",
        protocolName: "Compound",
        vault: VAULTS.COMPOUND,
    },
    {
        symbol: "coUSDT",
        name: "Compound Staked USDT",
        address: "0xdf5Ca06845d1b2F3ddff5759a493fB5aff68d72d",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.USDT,
        protocol: "compound",
        protocolName: "Compound",
        vault: VAULTS.COMPOUND,
    },
    {
        symbol: "coMNT",
        name: "Compound Staked MNT",
        address: "0xBfc03BA44AcA79cFe6732968f99E9DB0B3880828",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.MNT,
        protocol: "compound",
        protocolName: "Compound",
        vault: VAULTS.COMPOUND,
    },
    {
        symbol: "coBTC",
        name: "Compound Staked BTC",
        address: "0x4E55B3951d334aF5a88474d252f789911E1EFc55",
        decimals: 8,
        underlying: UNDERLYING_TOKENS.BTC,
        protocol: "compound",
        protocolName: "Compound",
        vault: VAULTS.COMPOUND,
    },
    {
        symbol: "coETH",
        name: "Compound Staked ETH",
        address: "0xE54116B3FA1623EB5aAC2ED4628002ceE620E9D8",
        decimals: 18,
        underlying: UNDERLYING_TOKENS.ETH,
        protocol: "compound",
        protocolName: "Compound",
        vault: VAULTS.COMPOUND,
    },
];

// Protocol image URLs
const PROTOCOL_IMAGES: Record<string, string> = {
    minterest: "https://raw.githubusercontent.com/Minterest-protocol/brand-assets/main/logo.svg",
    lendle: "https://assets.coingecko.com/coins/images/29628/small/lendle.png",
    "init-capital": "https://pbs.twimg.com/profile_images/1709185889318215680/fh2-U2oE_400x400.jpg",
    compound: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xc00e94Cb662C3520282E6f5717214004A7f26888/logo.png",
};

async function main() {
    const chainId = MANTLE_SEPOLIA_CHAIN_ID;
    console.log(`🌱 Seeding yield tokens for chain ${chainId}...`);

    let tokensCreated = 0;
    let tokensUpdated = 0;
    let providersCreated = 0;
    let providersUpdated = 0;

    for (const yieldToken of YIELD_TOKENS) {
        try {
            // 1. Create or update the representative (yield) token
            const existingToken = await prisma.token.findUnique({
                where: {
                    chainId_address: {
                        chainId,
                        address: yieldToken.address.toLowerCase(),
                    },
                },
            });

            const token = await prisma.token.upsert({
                where: {
                    chainId_address: {
                        chainId,
                        address: yieldToken.address.toLowerCase(),
                    },
                },
                update: {
                    symbol: yieldToken.symbol,
                    name: yieldToken.name,
                    decimals: yieldToken.decimals,
                    isRepresentativeToken: true,
                    isDeleted: false,
                },
                create: {
                    chainId,
                    address: yieldToken.address.toLowerCase(),
                    symbol: yieldToken.symbol,
                    name: yieldToken.name,
                    decimals: yieldToken.decimals,
                    isRepresentativeToken: true,
                    isDeleted: false,
                },
            });

            if (existingToken) {
                tokensUpdated++;
                console.log(`   🔄 Token updated: ${yieldToken.symbol}`);
            } else {
                tokensCreated++;
                console.log(`   ✅ Token created: ${yieldToken.symbol}`);
            }

            // 2. Find the underlying token
            const underlyingToken = await prisma.token.findUnique({
                where: {
                    chainId_address: {
                        chainId,
                        address: yieldToken.underlying.toLowerCase(),
                    },
                },
            });

            if (!underlyingToken) {
                console.log(
                    `   ⚠️  Underlying token not found for ${yieldToken.symbol}: ${yieldToken.underlying}`
                );
                continue;
            }

            // 3. Create or update the YieldProvider
            const existingProvider = await prisma.yieldProvider.findUnique({
                where: {
                    representativeTokenId: token.id,
                },
            });

            await prisma.yieldProvider.upsert({
                where: {
                    representativeTokenId: token.id,
                },
                update: {
                    chainId,
                    protocol: yieldToken.protocol,
                    protocolName: yieldToken.protocolName,
                    protocolImageUrl: PROTOCOL_IMAGES[yieldToken.protocol] || null,
                    underlyingTokenId: underlyingToken.id,
                    status: "ACTIVE",
                    adapterKey: `${yieldToken.protocol}-erc4626`,
                    aprSource: "ONCHAIN",
                    extraData: {
                        vault: yieldToken.vault,
                    },
                },
                create: {
                    chainId,
                    protocol: yieldToken.protocol,
                    protocolName: yieldToken.protocolName,
                    protocolImageUrl: PROTOCOL_IMAGES[yieldToken.protocol] || null,
                    underlyingTokenId: underlyingToken.id,
                    representativeTokenId: token.id,
                    status: "ACTIVE",
                    adapterKey: `${yieldToken.protocol}-erc4626`,
                    aprSource: "ONCHAIN",
                    extraData: {
                        vault: yieldToken.vault,
                    },
                },
            });

            if (existingProvider) {
                providersUpdated++;
                console.log(`   🔄 YieldProvider updated: ${yieldToken.symbol}`);
            } else {
                providersCreated++;
                console.log(`   ✅ YieldProvider created: ${yieldToken.symbol}`);
            }
        } catch (error) {
            console.error(`   ❌ Failed to seed ${yieldToken.symbol}:`, error);
        }
    }

    console.log(`\n🎉 Done!`);
    console.log(`   📊 Tokens - Created: ${tokensCreated}, Updated: ${tokensUpdated}`);
    console.log(`   📊 YieldProviders - Created: ${providersCreated}, Updated: ${providersUpdated}`);

    // Show summary
    const totalRepTokens = await prisma.token.count({
        where: { isRepresentativeToken: true, isDeleted: false, chainId },
    });
    const totalProviders = await prisma.yieldProvider.count({
        where: { chainId, status: "ACTIVE" },
    });
    console.log(`\n📊 Total active representative tokens on chain ${chainId}: ${totalRepTokens}`);
    console.log(`📊 Total active yield providers on chain ${chainId}: ${totalProviders}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
