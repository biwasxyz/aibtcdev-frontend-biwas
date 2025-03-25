"use client";

import { cn } from "@/lib/utils";

export function NetworkIndicator() {
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK || "mainnet";
  const isTestnet = network === "testnet";

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "h-2 w-2 rounded-full",
          isTestnet ? "bg-orange-500" : "bg-green-500",
          "animate-pulse"
        )}
      />
      <span
        className={cn(
          "text-sm font-medium",
          isTestnet ? "text-orange-500" : "text-green-500"
        )}
      >
        {network.toUpperCase()}
      </span>
    </div>
  );
}
