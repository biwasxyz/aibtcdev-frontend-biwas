"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    <Card className="border-none shadow-none bg-background/40 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base sm:text-2xl font-medium">
          Agent Wallet Information
        </CardTitle>
        <Separator className="my-2" />
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Agent Wallet Address
          </label>
          {walletAddress ? (
            <button
              onClick={() => copyToClipboard(walletAddress)}
              className="w-full flex items-center justify-between font-mono text-sm bg-muted/30 p-2 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <span>{walletAddress}</span>
              <span className="text-muted-foreground group-hover:text-foreground">
                {copiedAddress === walletAddress ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </span>
            </button>
          ) : (
            <div className="font-mono text-sm bg-muted/30 p-2 rounded-md text-muted-foreground">
              No wallet address
            </div>
          )}
        </div>

        {walletBalance && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                STX Balance
              </label>
              <div className="font-mono text-sm bg-muted/30 p-2 rounded-md">
                {formatStxBalance(walletBalance.stx.balance)} STX
              </div>
            </div>

            {Object.entries(walletBalance.fungible_tokens).length > 0 && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Fungible Tokens
                </label>
                <div className="space-y-2">
                  {Object.entries(walletBalance.fungible_tokens).map(
                    ([tokenId, token]) => {
                      const [, tokenSymbol] = tokenId.split("::");
                      return (
                        <div
                          key={tokenId}
                          className="flex justify-between items-center font-mono text-sm bg-muted/30 p-2 rounded-md"
                        >
                          <span>{tokenSymbol || "Token"}</span>
                          <span>{formatTokenBalance(token.balance)}</span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {Object.entries(walletBalance.non_fungible_tokens).length > 0 && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Non-Fungible Tokens
                </label>
                <div className="space-y-2">
                  {Object.entries(walletBalance.non_fungible_tokens).map(
                    ([tokenId, token]) => {
                      const [, tokenSymbol] = tokenId.split("::");
                      return (
                        <div
                          key={tokenId}
                          className="flex justify-between items-center font-mono text-sm bg-muted/30 p-2 rounded-md"
                        >
                          <span>{tokenSymbol || "NFT"}</span>
                          <span>{token.count} items</span>
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
