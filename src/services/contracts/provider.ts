"use client";

import { BrowserProvider, JsonRpcProvider } from "ethers";
import { getRpcUrls, DEFAULT_CHAIN_ID } from "@/config/rpc-config";

export function getBrowserProvider(): BrowserProvider {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("Wallet provider not found. Please connect your wallet.");
  }
  return new BrowserProvider((window as any).ethereum, "any");
}

/**
 * Get default RPC provider for the primary chain (client-side)
 * Uses fallback URL from rpc-config
 */
export function getRpcProvider(chainId: number = DEFAULT_CHAIN_ID): JsonRpcProvider {
  // Use env override only if requesting the default chain
  const envUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;
  if (envUrl && chainId === DEFAULT_CHAIN_ID) {
    return new JsonRpcProvider(envUrl);
  }
  // Fallback to first URL from config
  const urls = getRpcUrls(chainId);
  return new JsonRpcProvider(urls[0] || "https://sepolia.base.org");
}

/**
 * FallbackJsonRpcProvider - Provider with automatic RPC failover
 *
 * Tries each RPC URL in sequence until one succeeds.
 * Perfect for server-side operations where reliability is critical.
 */
export class FallbackJsonRpcProvider {
  private urls: string[];
  private currentIndex: number = 0;
  private provider: JsonRpcProvider;
  private chainId: number;
  private maxRetries: number;
  private retryDelay: number;

  /**
   * Create a new FallbackJsonRpcProvider
   * @param chainId - Chain ID to connect to
   * @param maxRetries - Maximum retries per URL (default: 2)
   * @param retryDelay - Delay between retries in ms (default: 500)
   */
  constructor(chainId: number, maxRetries: number = 2, retryDelay: number = 500) {
    this.chainId = chainId;
    this.urls = getRpcUrls(chainId);
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;

    if (this.urls.length === 0) {
      throw new Error(`No RPC URLs configured for chain ${chainId}`);
    }

    this.provider = new JsonRpcProvider(this.urls[0]);
  }

  /**
   * Get the current active provider
   */
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  /**
   * Switch to the next available RPC URL
   * @returns true if switched successfully, false if no more URLs
   */
  private switchToNext(): boolean {
    this.currentIndex++;
    if (this.currentIndex >= this.urls.length) {
      this.currentIndex = 0; // Reset to first URL
      return false;
    }
    console.log(`[RPC] Switching to: ${this.urls[this.currentIndex]}`);
    this.provider = new JsonRpcProvider(this.urls[this.currentIndex]);
    return true;
  }

  /**
   * Execute an async operation with automatic failover
   * @param operation - The async operation to execute
   * @returns The result of the operation
   */
  async execute<T>(operation: (provider: JsonRpcProvider) => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    const triedUrls = new Set<number>();

    while (triedUrls.size < this.urls.length) {
      triedUrls.add(this.currentIndex);

      for (let retry = 0; retry < this.maxRetries; retry++) {
        try {
          return await operation(this.provider);
        } catch (error: any) {
          lastError = error;
          const errorMsg = error.message || String(error);

          // Check if error is recoverable (network issue, rate limit)
          const isRecoverable =
            errorMsg.includes("failed to detect network") ||
            errorMsg.includes("ENOTFOUND") ||
            errorMsg.includes("ECONNREFUSED") ||
            errorMsg.includes("rate limit") ||
            errorMsg.includes("429") ||
            errorMsg.includes("timeout") ||
            errorMsg.includes("ETIMEDOUT");

          if (!isRecoverable) {
            // Non-recoverable error, throw immediately
            throw error;
          }

          console.warn(
            `[RPC] Request failed (${this.urls[this.currentIndex]}): ${errorMsg.substring(0, 100)}`
          );

          // Wait before retry
          if (retry < this.maxRetries - 1) {
            await this.sleep(this.retryDelay);
          }
        }
      }

      // All retries exhausted for current URL, try next
      if (!this.switchToNext()) {
        // We've gone through all URLs once, try again from start?
        // For now, just break and throw the last error
        break;
      }
    }

    throw new Error(
      `All RPC endpoints failed for chain ${this.chainId}. Last error: ${lastError?.message}`
    );
  }

  /**
   * Convenience method: Get transaction
   */
  async getTransaction(txHash: string) {
    return this.execute((p) => p.getTransaction(txHash));
  }

  /**
   * Convenience method: Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    return this.execute((p) => p.getTransactionReceipt(txHash));
  }

  /**
   * Convenience method: Get block
   */
  async getBlock(blockNumber: number) {
    return this.execute((p) => p.getBlock(blockNumber));
  }

  /**
   * Convenience method: Get block number
   */
  async getBlockNumber() {
    return this.execute((p) => p.getBlockNumber());
  }

  /**
   * Convenience method: Get network
   */
  async getNetwork() {
    return this.execute((p) => p.getNetwork());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a FallbackJsonRpcProvider for a specific chain
 * @param chainId - Chain ID
 * @returns FallbackJsonRpcProvider instance
 */
export function createFallbackProvider(chainId: number): FallbackJsonRpcProvider {
  return new FallbackJsonRpcProvider(chainId);
}
