"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletInfoCardProps {
  walletAddress?: string | null;
  walletBalance?: {
    stx: { balance: string };
    fungible_tokens: Record<string, { balance: string }>;
    non_fungible_tokens: Record<string, { count: number }>;
  } | null;
}

export function WalletInfoCard({
  walletAddress,
  walletBalance,
}: WalletInfoCardProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const { toast } = useToast();

  const truncateAddress = (address: string) => {
    if (!address) return "";
    if (address.length <= 10) return address;
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
      toast({
        title: "Failed to copy",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatStxBalance = (balance: string) => {
    return (Number(balance) / 1_000_000).toFixed(2);
  };

  const formatTokenBalance = (balance: string) => {
    return (Number(balance) / 1_000_000_00).toFixed(2);
  };

  return (
    <div className="p-4 rounded-xl bg-zinc-800/40 text-sm">
      <h3 className="font-medium text-zinc-300 mb-3">Wallet Address</h3>
      {walletAddress ? (
        <>
          <button
            onClick={() => copyToClipboard(walletAddress)}
            className="w-full flex items-center justify-between text-xs text-zinc-500 font-mono hover:text-zinc-300 transition-colors group mb-3"
          >
            <span>{truncateAddress(walletAddress)}</span>
            <span className="text-zinc-600 group-hover:text-zinc-400">
              {copiedAddress === walletAddress ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </span>
          </button>

          {walletBalance && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">STX Balance</span>
                <span className="text-zinc-200">
                  {formatStxBalance(walletBalance.stx.balance)} STX
                </span>
              </div>

              {Object.entries(walletBalance.fungible_tokens).map(
                ([tokenId, token]) => {
                  const [, tokenSymbol] = tokenId.split("::");
                  return (
                    <div
                      key={tokenId}
                      className="flex justify-between items-center"
                    >
                      <span className="text-zinc-400">
                        {tokenSymbol || "Token"}
                      </span>
                      <span className="text-zinc-200">
                        {formatTokenBalance(token.balance)}
                      </span>
                    </div>
                  );
                }
              )}

              {Object.entries(walletBalance.non_fungible_tokens).map(
                ([tokenId, token]) => {
                  const [, tokenSymbol] = tokenId.split("::");
                  return (
                    <div
                      key={tokenId}
                      className="flex justify-between items-center"
                    >
                      <span className="text-zinc-400">
                        {tokenSymbol || "NFT"}
                      </span>
                      <span className="text-zinc-200">{token.count} items</span>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-xs text-zinc-500 font-mono">No wallet address</div>
      )}
    </div>
  );
}
