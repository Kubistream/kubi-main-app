
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding random APRs...");

    const providers = await prisma.yieldProvider.findMany({
        where: {
            OR: [
                { apr: null },
                { apr: { equals: 0 } }
            ]
        }
    });

    console.log(`Found ${providers.length} providers to update.`);

    for (const provider of providers) {
        // Generate random APR between 2.5% and 8.5%
        const randomApr = (Math.random() * (8.5 - 2.5) + 2.5).toFixed(2);

        await prisma.yieldProvider.update({
            where: { id: provider.id },
            data: {
                apr: randomApr,
                aprUpdatedAt: new Date()
            }
        });

        console.log(`Updated ${provider.protocolName} (${provider.protocol}) APR to ${randomApr}%`);
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
