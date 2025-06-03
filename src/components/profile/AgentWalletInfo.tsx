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

// Mobile Asset Card Component
function MobileAssetCard({
  symbol,
  balance,
  isStx = false,
  isBtc = false,
  isNft = false,
}: {
  symbol: string;
  balance: string | number;
  isStx?: boolean;
  isBtc?: boolean;
  isNft?: boolean;
}) {
  const getColorClasses = () => {
    if (isStx) return "from-orange-500 to-orange-400";
    if (isBtc) return "from-yellow-500 to-yellow-400";
    if (isNft) return "from-purple-500 to-purple-400";
    return "from-blue-500 to-blue-400";
  };

  const renderBalance = () => {
    if (isStx) {
      return <StxBalance value={balance as string} variant="rounded" />;
    }
    if (isBtc) {
      return <BtcBalance value={balance as string} variant="rounded" />;
    }
    if (isNft) {
      return <span className="font-mono text-muted-foreground text-base font-semibold">{balance}</span>;
    }
    return <TokenBalance value={balance as string} symbol={symbol} variant="rounded" />;
  };

  return (
    <div className="bg-gradient-to-br from-card/40 via-card/30 to-card/20 backdrop-blur-sm rounded-xl border border-border/20 p-4 space-y-3 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getColorClasses()} shadow-sm`} />
          <span className="font-bold text-foreground text-base">{symbol}</span>
        </div>
        <div className="text-right">
          {renderBalance()}
        </div>
      </div>
    </div>
  );
}

export function WalletInfoCard({
  walletAddress,
  walletBalance,
}: WalletInfoCardProps) {
  const { copiedText, copyToClipboard } = useClipboard();

  // Prepare asset data for mobile cards
  const assets: Array<{
    symbol: string;
    balance: string | number;
    isStx?: boolean;
    isBtc?: boolean;
    isNft?: boolean;
  }> = [];
  
  if (walletBalance?.stx) {
    assets.push({
      symbol: "STX",
      balance: walletBalance.stx.balance,
      isStx: true,
    });
  }

  if (walletBalance?.fungible_tokens) {
    Object.entries(walletBalance.fungible_tokens).forEach(([tokenId, token]) => {
      const [, tokenSymbol] = tokenId.split("::");
      const isBtc = tokenId.includes("sbtc-token");
      const displaySymbol = isBtc ? "BTC" : tokenSymbol || "Token";
      
      assets.push({
        symbol: displaySymbol,
        balance: token.balance,
        isBtc,
      });
    });
  }

  if (walletBalance?.non_fungible_tokens) {
    Object.entries(walletBalance.non_fungible_tokens).forEach(([tokenId, token]) => {
      const [, tokenSymbol] = tokenId.split("::");
      const displaySymbol = tokenSymbol || "NFT";
      
      assets.push({
        symbol: displaySymbol,
        balance: token.count,
        isNft: true,
      });
    });
  }

  return (
    <div className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border-border/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 lg:space-y-10 shadow-xl hover:shadow-2xl transition-all duration-500 group overflow-hidden relative">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Enhanced Header Section */}
      <div className="flex items-center gap-3 sm:gap-4 relative">
        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
          <Wallet className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary" />
        </div>
        <div className="space-y-1 sm:space-y-2">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground tracking-tight">Agent Wallet</h3>
          <p className="text-sm sm:text-base text-muted-foreground font-light tracking-wide">Automated governance account</p>
        </div>
        <div className="ml-auto">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse shadow-sm" />
        </div>
      </div>

      {/* Enhanced Wallet Address Section */}
      {walletAddress ? (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Enhanced Avatar */}
            <div className="relative group/avatar mx-auto sm:mx-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent border border-secondary/20 flex items-center justify-center shadow-lg group-hover/avatar:shadow-xl group-hover/avatar:scale-105 transition-all duration-300">
                <Wallet className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 text-secondary" />
              </div>
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full border-2 border-card flex items-center justify-center shadow-lg">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-2.5 lg:h-2.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            {/* Enhanced Address Info */}
            <div className="flex-1 min-w-0 space-y-3 sm:space-y-4 w-full text-center sm:text-left">
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-border/30 shadow-sm hover:shadow-md transition-all duration-300">
                <p className="font-mono text-xs sm:text-sm text-foreground break-all leading-relaxed">
                  {walletAddress}
                </p>
              </div>
              <p className="text-xs text-muted-foreground font-semibold tracking-widest uppercase">
                Agent Wallet Address
              </p>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(walletAddress)}
              className="w-full sm:w-auto text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 transition-all duration-300 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl group/button border border-transparent hover:border-border/30 shadow-sm hover:shadow-md font-medium min-h-[44px] sm:min-h-auto"
            >
              {copiedText === walletAddress ? (
                <Check className="h-4 w-4 mr-2 sm:mr-3 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2 sm:mr-3 group-hover/button:scale-110 transition-transform duration-300" />
              )}
              <span>{copiedText === walletAddress ? "Copied!" : "Copy Address"}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="w-full sm:w-auto text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 transition-all duration-300 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl group/button border border-transparent hover:border-border/30 shadow-sm hover:shadow-md font-medium min-h-[44px] sm:min-h-auto"
            >
              <a
                href={getAddressExplorerUrl(walletAddress)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2 sm:mr-3 group-hover/button:scale-110 transition-transform duration-300" />
                <span>View Explorer</span>
              </a>
            </Button>
          </div>
        </div>
      ) : (
        /* Enhanced No Wallet State */
        <div className="text-center py-8 sm:py-12 lg:py-16 space-y-4 sm:space-y-6 lg:space-y-8 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30 shadow-lg">
            <Wallet className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground/50" />
          </div>
          <div className="space-y-3 sm:space-y-4 max-w-md mx-auto px-4">
            <h4 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground">
              No Wallet Configured
            </h4>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
              Agent wallet will appear here when the AI agent is properly configured and deployed
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Asset Balances Section */}
      <div className="space-y-4 sm:space-y-6 relative">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-400/20 border border-emerald-500/30 flex items-center justify-center shadow-sm">
            <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
          </div>
          <div>
            <h4 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Asset Balances</h4>
            <p className="text-sm text-muted-foreground font-light">Available tokens and assets</p>
          </div>
        </div>
        
        {/* Mobile Layout - Cards */}
        <div className="lg:hidden space-y-3">
          {assets.length > 0 ? (
            assets.map((asset, index) => (
              <MobileAssetCard
                key={`${asset.symbol}-${index}`}
                symbol={asset.symbol}
                balance={asset.balance}
                isStx={asset.isStx}
                isBtc={asset.isBtc}
                isNft={asset.isNft}
              />
            ))
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30 flex items-center justify-center shadow-lg">
                <Coins className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <h5 className="text-base font-semibold text-foreground">No Assets Found</h5>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  Asset balances will appear here when the agent wallet holds tokens
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout - Table */}
        <div className="hidden lg:block bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-3xl border border-border/30 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group/table">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-transparent opacity-0 group-hover/table:opacity-100 transition-opacity duration-500" />
          
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 bg-gradient-to-r from-muted/40 via-muted/30 to-muted/20 backdrop-blur-sm">
                <TableHead className="text-foreground font-bold px-8 py-6 text-base tracking-wide">Asset</TableHead>
                <TableHead className="text-foreground font-bold px-8 py-6 text-base tracking-wide">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* STX Balance */}
              {walletBalance?.stx && (
                <TableRow className="border-border/20 hover:bg-gradient-to-r hover:from-muted/20 hover:via-muted/10 hover:to-transparent transition-all duration-300 group/row">
                  <TableCell className="font-bold text-foreground px-8 py-6 text-base">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 shadow-sm" />
                      STX
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <StxBalance
                      value={walletBalance.stx.balance}
                      variant="rounded"
                    />
                  </TableCell>
                </TableRow>
              )}

              {/* Enhanced Fungible Tokens */}
              {walletBalance &&
                Object.entries(walletBalance.fungible_tokens).map(
                  ([tokenId, token]) => {
                    const [, tokenSymbol] = tokenId.split("::");
                    // Check if this is an sBTC token and display as BTC instead
                    const isBtc = tokenId.includes("sbtc-token");
                    const displaySymbol = isBtc ? "BTC" : tokenSymbol || "Token";

                    return (
                      <TableRow key={tokenId} className="border-border/20 hover:bg-gradient-to-r hover:from-muted/20 hover:via-muted/10 hover:to-transparent transition-all duration-300 group/row">
                        <TableCell className="font-bold text-foreground px-8 py-6 text-base">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full shadow-sm ${
                              isBtc 
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-400" 
                                : "bg-gradient-to-r from-blue-500 to-blue-400"
                            }`} />
                            {displaySymbol}
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-6">
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

              {/* Enhanced NFTs */}
              {walletBalance &&
                Object.entries(walletBalance.non_fungible_tokens).map(
                  ([tokenId, token]) => {
                    const [, tokenSymbol] = tokenId.split("::");
                    const displaySymbol = tokenSymbol || "NFT";
                    return (
                      <TableRow key={tokenId} className="border-border/20 hover:bg-gradient-to-r hover:from-muted/20 hover:via-muted/10 hover:to-transparent transition-all duration-300 group/row">
                        <TableCell className="font-bold text-foreground px-8 py-6 text-base">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-400 shadow-sm" />
                            {displaySymbol}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground px-8 py-6 text-base font-semibold">
                          {token.count}
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}

              {/* Enhanced Empty State */}
              {(!walletBalance ||
                (Object.entries(walletBalance.fungible_tokens).length === 0 &&
                  Object.entries(walletBalance.non_fungible_tokens).length === 0 &&
                  !walletBalance.stx)) && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-20">
                    <div className="flex flex-col items-center space-y-6">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30 flex items-center justify-center shadow-lg">
                        <Coins className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                      <div className="space-y-3 max-w-md">
                        <h5 className="text-xl font-semibold text-foreground">No Assets Found</h5>
                        <p className="text-muted-foreground font-light leading-relaxed">
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
