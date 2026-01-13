
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Listing Yield Providers...");

    const providers = await prisma.yieldProvider.findMany({
        select: {
            id: true,
            protocol: true,
            protocolName: true,
            protocolImageUrl: true
        }
    });

    console.table(providers);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
