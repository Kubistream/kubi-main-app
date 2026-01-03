
import { prisma } from "@/lib/prisma";
import { FaucetView } from "@/components/faucet/faucet-view";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Kubi Faucet | Get Test Tokens",
    description: "Get testnet tokens for the Kubi platform on Base Sepolia.",
};

export default async function FaucetPage() {
    // Fetch only non-yield tokens that are not deleted
    const tokens = await prisma.token.findMany({
        where: {
            isRepresentativeToken: false,
            isDeleted: false,
        },
        orderBy: {
            symbol: 'asc',
        }
    });

    return <FaucetView tokens={tokens} />;
}
