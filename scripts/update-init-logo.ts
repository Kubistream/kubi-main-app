
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Updating INIT Capital logo...");

    // Find providers by protocol identifier or name
    const providers = await prisma.yieldProvider.findMany({
        where: {
            OR: [
                { protocol: { contains: "init", mode: "insensitive" } },
                { protocolName: { contains: "INIT", mode: "insensitive" } }
            ]
        }
    });

    console.log(`Found ${providers.length} INIT Capital providers.`);

    const newLogoUrl = "https://init.capital/_next/static/media/init-capital-logo.3b4034e2.svg";

    for (const p of providers) {
        console.log(`Updating INIT Capital (${p.id}): ${p.protocolImageUrl} -> ${newLogoUrl}`);
        await prisma.yieldProvider.update({
            where: { id: p.id },
            data: { protocolImageUrl: newLogoUrl }
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
