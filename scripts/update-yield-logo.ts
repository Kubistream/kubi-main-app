
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Updating Lendle logo...");

    // Find provider by protocol identifier or name
    const provider = await prisma.yieldProvider.findFirst({
        where: {
            OR: [
                { protocol: "lendle" },
                { protocolName: { contains: "Lendle", mode: "insensitive" } }
            ]
        }
    });

    if (!provider) {
        console.error("Lendle provider not found!");
        return;
    }

    // Update the image URL
    await prisma.yieldProvider.update({
        where: { id: provider.id },
        data: {
            protocolImageUrl: "/assets/yield/lendle.jpg"
        }
    });

    console.log(`Updated ${provider.protocolName} (${provider.protocol}) logo to /assets/yield/lendle.jpg`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
