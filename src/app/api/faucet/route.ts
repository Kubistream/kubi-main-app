
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JsonRpcProvider, Wallet, Contract, parseUnits } from "ethers";
import ERC20_ABI from "@/abis/ERC20.json";

// Default amount to dispense: 100 tokens (adjusted by decimals)
const DEFAULT_AMOUNT = "100";

export async function POST(req: Request) {
    try {
        const { walletAddress, tokenId } = await req.json();

        if (!walletAddress || !tokenId) {
            return NextResponse.json(
                { error: "Missing walletAddress or tokenId" },
                { status: 400 }
            );
        }

        // 1. Fetch token details from DB
        const token = await prisma.token.findUnique({
            where: { id: tokenId },
        });

        if (!token) {
            return NextResponse.json({ error: "Token not found" }, { status: 404 });
        }

        // 2. Setup Provider & Wallet
        // Note: In a real environment, protect this private key!
        const privateKey = process.env.FAUCET_PRIVATE_KEY;
        if (!privateKey) {
            return NextResponse.json(
                { error: "Faucet configuration missing (FAUCET_PRIVATE_KEY)" },
                { status: 500 }
            );
        }

        // Use Base Sepolia RPC by default or from env
        const rpcUrl =
            process.env.NEXT_PUBLIC_BASE_RPC_URL ||
            "https://base-sepolia.g.alchemy.com/v2/okjfsx8BQgIIx7k_zPuLKtTUAk9TaJqa";
        const provider = new JsonRpcProvider(rpcUrl);
        const wallet = new Wallet(privateKey, provider);

        // 3. Connect to Token Contract
        const tokenContract = new Contract(token.address, ERC20_ABI, wallet);

        // 4. Send Tokens
        // Convert 100 to appropriate decimals
        const amountToSend = parseUnits(DEFAULT_AMOUNT, token.decimals);

        // Check faucet balance (optional but good practice)
        // const faucetBalance = await tokenContract.balanceOf(wallet.address);
        // if (faucetBalance < amountToSend) { ... }

        const tx = await tokenContract.transfer(walletAddress, amountToSend);

        // Check if we need to wait for confirmation. 
        // For specific UI feedback, maybe we return hash immediately.
        // await tx.wait();

        return NextResponse.json({
            success: true,
            txHash: tx.hash,
            amount: DEFAULT_AMOUNT,
            symbol: token.symbol,
        });
    } catch (error: any) {
        console.error("Faucet error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
