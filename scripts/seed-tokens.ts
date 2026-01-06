import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Base Sepolia: 84532
// Mantle Sepolia: 5003

const NON_REPRESENTATIVE_TOKENS = [
    {
        symbol: "MNT",
        name: "Mantle",
        address: "0x33c6f26dA09502E6540043f030aE1F87f109cc99",
        decimals: 18,
        logoURI: "https://cryptologos.cc/logos/mantle-mnt-logo.png?v=040",
    },
    {
        symbol: "ETH",
        name: "Ethereum",
        address: "0x7CB382Ce1AA40FA9F9A59a632090c05Dc28caE7b",
        decimals: 18,
        logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
    },
    {
        symbol: "USDC",
        name: "USD Coin",
        address: "0xB288Ba5B5b80Dd0Fd83541ef2e5922f71121Fa13",
        decimals: 18,
        logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
    },
    {
        symbol: "USDT",
        name: "Tether USD",
        address: "0xC4a53c466Cfb62AecED03008B0162baaf36E0B03",
        decimals: 18,
        logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
    },
    {
        symbol: "PUFF",
        name: "Puff Token",
        address: "0x70Db6eFB75c898Ad1e194FDA2B8C6e73dbC944d6",
        decimals: 18,
        logoURI: null,
    },
    {
        symbol: "AXL",
        name: "Axelar",
        address: "0xEE589FBF85128abA6f42696dB2F28eA9EBddE173",
        decimals: 18,
        logoURI: "https://assets.coingecko.com/coins/images/27277/small/V-65_xQ1_400x400.jpeg",
    },
    {
        symbol: "SVL",
        name: "Swivel",
        address: "0x2C036be74942c597e4d81D7050008dDc11becCEb",
        decimals: 18,
        logoURI: null,
    },
    {
        symbol: "LINK",
        name: "Chainlink",
        address: "0x90CdcBF4c4bc78dC440252211EFd744d0A4Dc4A1",
        decimals: 18,
        logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png",
    },
    {
        symbol: "WBTC",
        name: "Wrapped Bitcoin",
        address: "0xced6Ceb47301F268d57fF07879DF45Fda80e6974",
        decimals: 8,
        logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",
    },
    {
        symbol: "PENDLE",
        name: "Pendle",
        address: "0x782Ba48189AF93a0CF42766058DE83291f384bF3",
        decimals: 18,
        logoURI: "https://assets.coingecko.com/coins/images/15069/small/Pendle_Logo_Normal-03.png",
    },
];

// Chain IDs to seed for
const CHAIN_IDS = [84532, 5003]; // Base Sepolia, Mantle Sepolia

// Get new token addresses for reference (lowercase)
const NEW_TOKEN_ADDRESSES = NON_REPRESENTATIVE_TOKENS.map((t) =>
    t.address.toLowerCase()
);

async function main() {
    console.log("🗑️  Marking old non-representative tokens as deleted...");

    // Mark all old non-representative tokens that are NOT in the new list as isDeleted
    const markedDeleted = await prisma.token.updateMany({
        where: {
            isRepresentativeToken: false,
            address: { notIn: NEW_TOKEN_ADDRESSES },
        },
        data: {
            isDeleted: true,
        },
    });
    console.log(`   Marked ${markedDeleted.count} old tokens as deleted.`);

    console.log("\n🌱 Seeding new non-representative tokens...");

    let created = 0;
    let updated = 0;

    for (const chainId of CHAIN_IDS) {
        for (const token of NON_REPRESENTATIVE_TOKENS) {
            try {
                const existing = await prisma.token.findUnique({
                    where: {
                        chainId_address: {
                            chainId,
                            address: token.address.toLowerCase(),
                        },
                    },
                });

                await prisma.token.upsert({
                    where: {
                        chainId_address: {
                            chainId,
                            address: token.address.toLowerCase(),
                        },
                    },
                    update: {
                        symbol: token.symbol,
                        name: token.name,
                        decimals: token.decimals,
                        logoURI: token.logoURI,
                        isRepresentativeToken: false,
                        isDeleted: false, // Ensure new tokens are not deleted
                    },
                    create: {
                        chainId,
                        address: token.address.toLowerCase(),
                        symbol: token.symbol,
                        name: token.name,
                        decimals: token.decimals,
                        logoURI: token.logoURI,
                        isRepresentativeToken: false,
                        isDeleted: false,
                    },
                });

                if (existing) {
                    updated++;
                    console.log(`   🔄 [Chain ${chainId}] Updated ${token.symbol}`);
                } else {
                    created++;
                    console.log(`   ✅ [Chain ${chainId}] Created ${token.symbol}`);
                }

                // Ensure global whitelist
                // We need a user ID for 'updatedBy'. Let's try to find one or create a dummy one.
                let adminUser = await prisma.user.findFirst({
                    where: { role: "SUPERADMIN" },
                });

                if (!adminUser) {
                    // Try to find ANY user
                    adminUser = await prisma.user.findFirst();
                }

                if (!adminUser) {
                    // Create a dummy system user if absolutely no users exist
                    console.log("   ⚠️ No users found. Creating system user for whitelist seeding...");
                    adminUser = await prisma.user.create({
                        data: {
                            wallet: "0x0000000000000000000000000000000000000000",
                            role: "SUPERADMIN",
                            username: "system_seeder"
                        }
                    });
                }

                await prisma.globalTokenWhitelist.upsert({
                    where: { tokenId: (existing?.id || (await prisma.token.findUnique({ where: { chainId_address: { chainId, address: token.address.toLowerCase() } } }))!.id) },
                    create: {
                        tokenId: (existing?.id || (await prisma.token.findUnique({ where: { chainId_address: { chainId, address: token.address.toLowerCase() } } }))!.id),
                        allowed: true,
                        updatedBy: adminUser.id
                    },
                    update: {
                        allowed: true
                    }
                });
            } catch (error) {
                console.error(
                    `   ❌ [Chain ${chainId}] Failed to seed ${token.symbol}:`,
                    error
                );
            }
        }
    }

    console.log(`\n🎉 Done! Created ${created}, Updated ${updated} tokens.`);

    // Show summary
    const totalActive = await prisma.token.count({
        where: { isRepresentativeToken: false, isDeleted: false },
    });
    const totalDeleted = await prisma.token.count({
        where: { isRepresentativeToken: false, isDeleted: true },
    });
    console.log(`📊 Active non-representative tokens: ${totalActive}`);
    console.log(`📊 Deleted non-representative tokens: ${totalDeleted}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
