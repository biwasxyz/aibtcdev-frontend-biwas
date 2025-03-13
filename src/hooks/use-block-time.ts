import { useState, useEffect } from "react";

const useBlockTime = (
    blockHeight: number,
    fallback?: { referenceTime: Date; referenceBlock: number }
) => {
    const [blockTime, setBlockTime] = useState<Date | null>(null);

    useEffect(() => {
        if (!blockHeight) return;
        const baseURL =
            process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
                ? "https://api.testnet.hiro.so"
                : "https://api.hiro.so";
        fetch(`${baseURL}/extended/v2/burn-blocks/${blockHeight}`)
            .then((res) => {
                if (!res.ok) {
                    if (res.status === 404 && fallback) {
                        // Estimate block time based on average block time (4 min for testnet, 12 min for mainnet)
                        const avgBlockTime =
                            process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
                                ? 4 * 60 * 1000
                                : 12 * 60 * 1000;
                        const diff = blockHeight - fallback.referenceBlock;
                        const estimatedTime = new Date(
                            fallback.referenceTime.getTime() + diff * avgBlockTime
                        );
                        setBlockTime(estimatedTime);
                    }
                    return res.json();
                }
                return res.json();
            })
            .then((data) => {
                if (data && data.burn_block_time_iso) {
                    setBlockTime(new Date(data.burn_block_time_iso));
                }
            })
            .catch((err) => {
                console.error("Error fetching burn block data:", err);
                if (fallback) {
                    const avgBlockTime =
                        process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
                            ? 4 * 60 * 1000
                            : 12 * 60 * 1000;
                    const diff = blockHeight - fallback.referenceBlock;
                    const estimatedTime = new Date(
                        fallback.referenceTime.getTime() + diff * avgBlockTime
                    );
                    setBlockTime(estimatedTime);
                }
            });
    }, [blockHeight, fallback]);

    return blockTime;
};

export default useBlockTime;
