"use client";

import type { WalletBalance } from "@/store/wallet";

interface AgentBalanceProps {
  balance: WalletBalance;
  requiredTokenSymbol?: string;
}

/**
 * AgentBalance Component
 * Displays the balance information for an agent's wallet
 */
export function AgentBalance({
  balance,
  requiredTokenSymbol,
}: AgentBalanceProps) {
  const formatBalance = (balance: string) => {
    return (Number(balance) / 1_000_000).toFixed(6);
  };

  return (
    <div className="space-y-1">
      {/* STX Balance */}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">STX</span>
        <span className="text-foreground">
          {formatBalance(balance.stx.balance)}
        </span>
      </div>

      {/* Fungible Tokens */}
      {Object.entries(balance.fungible_tokens).map(([tokenId, token]) => {
        const [, tokenSymbol] = tokenId.split("::");
        return (
          <div
            key={tokenId}
            className={`flex justify-between text-sm ${
              requiredTokenSymbol === tokenSymbol
                ? "font-bold text-foreground"
                : ""
            }`}
          >
            <span className="text-muted-foreground">{tokenSymbol}</span>
            <span className="text-foreground">
              {formatBalance(token.balance)}
            </span>
          </div>
        );
      })}

      {/* Non-Fungible Tokens */}
      {Object.entries(balance.non_fungible_tokens).map(([tokenId, token]) => {
        const [, tokenSymbol] = tokenId.split("::");
        return (
          <div key={tokenId} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {tokenSymbol || "NFT"}
            </span>
            <span className="text-foreground">{token.count} items</span>
          </div>
        );
      })}
    </div>
  );
}
