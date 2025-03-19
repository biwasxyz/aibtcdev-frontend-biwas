'use client';

import { useQuery } from '@tanstack/react-query';

// Helper function to fetch a single block
const fetchBlockData = async (blockNumber: number, baseURL: string, apiKey: string) => {
    const response = await fetch(
        `${baseURL}/extended/v2/burn-blocks/${blockNumber}`,
        {
            headers: {
                "Accept": "application/json",
                "X-API-Key": apiKey || "",
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch block ${blockNumber}`);
    }

    const data = await response.json();
    return data.burn_block_time_iso;
};

// Hook to fetch block times
export function useBlockTimes(startBlock: number, endBlock: number) {
    const baseURL =
        process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
            ? "https://api.testnet.hiro.so"
            : "https://api.hiro.so";

    const apiKey = process.env.NEXT_PUBLIC_HIRO_API_KEY || "";

    // Query for start block
    const startBlockQuery = useQuery({
        queryKey: ['blockData', startBlock, baseURL],
        queryFn: () => fetchBlockData(startBlock, baseURL, apiKey),
        staleTime: 60 * 60 * 1000, // 1 hour

    });

    // Query for end block
    const endBlockQuery = useQuery({
        queryKey: ['blockData', endBlock, baseURL],
        queryFn: () => fetchBlockData(endBlock, baseURL, apiKey),
        staleTime: 60 * 60 * 1000, // 1 hour

    });

    // Combined result
    return {
        startBlockTime: startBlockQuery.data ?? null,
        endBlockTime: endBlockQuery.data ?? null,
        isLoading: startBlockQuery.isLoading || endBlockQuery.isLoading,
        isError: startBlockQuery.isError || endBlockQuery.isError,
        error: startBlockQuery.error || endBlockQuery.error,
    };
}

// If you need to manually fetch data (to maintain similar API to original)
export const fetchBlockTimes = async (startBlock: number, endBlock: number) => {
    const baseURL =
        process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
            ? "https://api.testnet.hiro.so"
            : "https://api.hiro.so";

    const apiKey = process.env.NEXT_PUBLIC_HIRO_API_KEY || "";

    try {
        const [startBlockData, endBlockData] = await Promise.all([
            fetchBlockData(startBlock, baseURL, apiKey),
            fetchBlockData(endBlock, baseURL, apiKey)
        ]);

        return {
            startBlockTime: startBlockData,
            endBlockTime: endBlockData,
        };
    } catch (error) {
        console.error("Error fetching block times:", error);
        return {
            startBlockTime: null,
            endBlockTime: null,
        };
    }
};