"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      });
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
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/40 pb-3">
        <CardTitle className="text-lg font-medium">Agent Wallet</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {walletAddress ? (
          <div className="flex items-center justify-between gap-2 bg-muted/20 p-3 rounded-md">
            <div className="truncate font-mono text-xs sm:text-sm">
              {walletAddress}
            </div>
            <button
              onClick={() => copyToClipboard(walletAddress)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Copy wallet address"
            >
              {copiedAddress === walletAddress ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-md">
            No wallet address
          </div>
        )}

        {walletBalance && (
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
              <span className="text-sm font-medium">STX Balance</span>
              <Badge variant="outline" className="font-mono">
                {formatStxBalance(walletBalance.stx.balance)} STX
              </Badge>
            </div>

            {Object.entries(walletBalance.fungible_tokens).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Tokens</h3>
                <div className="grid gap-1">
                  {Object.entries(walletBalance.fungible_tokens).map(
                    ([tokenId, token]) => {
                      const [, tokenSymbol] = tokenId.split("::");
                      return (
                        <div
                          key={tokenId}
                          className="flex justify-between items-center p-2 bg-muted/10 rounded-md"
                        >
                          <span className="text-xs">
                            {tokenSymbol || "Token"}
                          </span>
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            {formatTokenBalance(token.balance)}
                          </Badge>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {Object.entries(walletBalance.non_fungible_tokens).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">NFTs</h3>
                <div className="grid gap-1">
                  {Object.entries(walletBalance.non_fungible_tokens).map(
                    ([tokenId, token]) => {
                      const [, tokenSymbol] = tokenId.split("::");
                      return (
                        <div
                          key={tokenId}
                          className="flex justify-between items-center p-2 bg-muted/10 rounded-md"
                        >
                          <span className="text-xs">
                            {tokenSymbol || "NFT"}
                          </span>
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            {token.count}
                          </Badge>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
