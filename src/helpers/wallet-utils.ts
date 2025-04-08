import type { Wallet } from "@/types/supabase"

/**
 * Gets the appropriate wallet address based on the current network
 */
export function getWalletAddress(wallet: Wallet | null | undefined): string {
    if (!wallet) return ""

    return process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
        ? wallet.mainnet_address
        : wallet.testnet_address
}
