
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Force updating logos...");

    // 1. Update Minterest
    const minterestProviders = await prisma.yieldProvider.findMany({
        where: {
            OR: [
                { protocol: { contains: "minterest", mode: "insensitive" } },
                { protocolName: { contains: "Minterest", mode: "insensitive" } }
            ]
        }
    });

    console.log(`Found ${minterestProviders.length} Minterest providers.`);
    for (const p of minterestProviders) {
        console.log(`Updating Minterest (${p.id}): ${p.protocolImageUrl} -> /assets/yield/minterest.jpg`);
        await prisma.yieldProvider.update({
            where: { id: p.id },
            data: { protocolImageUrl: "/assets/yield/minterest.jpg" }
        });
    }

    // 2. Update Lendle
    const lendleProviders = await prisma.yieldProvider.findMany({
        where: {
            OR: [
                { protocol: { contains: "lendle", mode: "insensitive" } },
                { protocolName: { contains: "Lendle", mode: "insensitive" } }
            ]
        }
    });

    console.log(`Found ${lendleProviders.length} Lendle providers.`);
    for (const p of lendleProviders) {
        console.log(`Updating Lendle (${p.id}): ${p.protocolImageUrl} -> /assets/yield/lendle.jpg`);
        await prisma.yieldProvider.update({
            where: { id: p.id },
            data: { protocolImageUrl: "/assets/yield/lendle.jpg" }
        });
    }

    console.log("Done.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
