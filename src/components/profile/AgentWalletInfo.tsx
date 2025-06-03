"use client";

import { Copy, Check, ExternalLink, Wallet, Coins } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/helpers/clipboard-utils";
import { getAddressExplorerUrl } from "@/helpers/explorer";
import {
  StxBalance,
  BtcBalance,
  TokenBalance,
} from "@/components/reusables/BalanceDisplay";

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
  const { copiedText, copyToClipboard } = useClipboard();

  return (
    <div className="bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl p-8 space-y-8 shadow-sm hover:border-border/80 transition-all duration-300">
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Agent Wallet</h3>
          <p className="text-sm text-muted-foreground">Automated governance account</p>
        </div>
      </div>

      {/* Wallet Address Section */}
      {walletAddress ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {/* Enhanced Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
              <Wallet className="h-7 w-7 text-secondary" />
            </div>

            {/* Address Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="bg-muted/30 px-4 py-3 rounded-xl border border-border/30">
                <p className="font-mono text-sm text-foreground break-all">
                  {walletAddress}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Agent Wallet Address</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(walletAddress)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 px-4 py-2 rounded-xl group/button"
            >
              {copiedText === walletAddress ? (
                <Check className="h-4 w-4 mr-2 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2 group-hover/button:scale-110 transition-transform duration-300" />
              )}
              {copiedText === walletAddress ? "Copied!" : "Copy Address"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 px-4 py-2 rounded-xl group/button"
            >
              <a
                href={getAddressExplorerUrl(walletAddress)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2 group-hover/button:scale-110 transition-transform duration-300" />
                View Explorer
              </a>
            </Button>
          </div>
        </div>
      ) : (
        /* No Wallet State */
        <div className="text-center py-12 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-muted/50">
            <Wallet className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-foreground">
              No Wallet Configured
            </h4>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Agent wallet will appear here when the AI agent is properly configured and deployed
            </p>
          </div>
        </div>
      )}

      {/* Asset Balances Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center">
            <Coins className="h-5 w-5 text-emerald-500" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Asset Balances</h4>
        </div>
        
        <div className="bg-muted/20 rounded-2xl border border-border/30 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/30">
                <TableHead className="text-foreground font-semibold px-6 py-4">Asset</TableHead>
                <TableHead className="text-foreground font-semibold px-6 py-4">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* STX Balance */}
              {walletBalance && (
                <TableRow className="border-border/30 hover:bg-muted/20 transition-colors duration-300">
                  <TableCell className="font-semibold text-foreground px-6 py-4">STX</TableCell>
                  <TableCell className="px-6 py-4">
                    <StxBalance
                      value={walletBalance.stx.balance}
                      variant="rounded"
                    />
                  </TableCell>
                </TableRow>
              )}

              {/* Fungible Tokens */}
              {walletBalance &&
                Object.entries(walletBalance.fungible_tokens).map(
                  ([tokenId, token]) => {
                    const [, tokenSymbol] = tokenId.split("::");
                    // Check if this is an sBTC token and display as BTC instead
                    const isBtc = tokenId.includes("sbtc-token");
                    const displaySymbol = isBtc ? "BTC" : tokenSymbol || "Token";

                    return (
                      <TableRow key={tokenId} className="border-border/30 hover:bg-muted/20 transition-colors duration-300">
                        <TableCell className="font-semibold text-foreground px-6 py-4">
                          {displaySymbol}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {isBtc ? (
                            <BtcBalance value={token.balance} variant="rounded" />
                          ) : (
                            <TokenBalance
                              value={token.balance}
                              symbol={displaySymbol}
                              variant="rounded"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}

              {/* NFTs */}
              {walletBalance &&
                Object.entries(walletBalance.non_fungible_tokens).map(
                  ([tokenId, token]) => {
                    const [, tokenSymbol] = tokenId.split("::");
                    const displaySymbol = tokenSymbol || "NFT";
                    return (
                      <TableRow key={tokenId} className="border-border/30 hover:bg-muted/20 transition-colors duration-300">
                        <TableCell className="font-semibold text-foreground px-6 py-4">
                          {displaySymbol}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground px-6 py-4">
                          {token.count}
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}

              {/* Show empty state if no balances */}
              {(!walletBalance ||
                (Object.entries(walletBalance.fungible_tokens).length === 0 &&
                  Object.entries(walletBalance.non_fungible_tokens).length === 0 &&
                  !walletBalance.stx)) && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-16">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <Coins className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-foreground font-medium">No Assets Found</p>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Asset balances will appear here when the agent wallet holds tokens
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
