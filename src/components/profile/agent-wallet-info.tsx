"use client";

import { Copy, Check, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClipboard } from "@/helpers/clipboard-utils";
import { getAddressExplorerUrl } from "@/helpers/explorer";
import {
  StxBalance,
  BtcBalance,
  TokenBalance,
} from "@/components/reusables/balance-display";

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
    <div className="w-full h-full p-4 border rounded-lg bg-card">
      <div className="flex flex-col gap-4">
        <h2 className="text-base sm:text-2xl font-medium">Agent Account</h2>

        {walletAddress ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs sm:text-sm truncate max-w-full">
              {walletAddress}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => copyToClipboard(walletAddress)}
                className="p-1 hover:bg-muted rounded-md"
                title="Copy address"
              >
                {copiedText === walletAddress ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <a
                href={getAddressExplorerUrl(walletAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-muted rounded-md"
                title="View on explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">No wallet address</span>
        )}
      </div>

      <div className="w-full overflow-x-auto mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Asset</TableHead>
              <TableHead className="w-2/3">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* STX Balance */}
            {walletBalance && (
              <TableRow>
                <TableCell className="font-medium">STX</TableCell>
                <TableCell>
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
                    <TableRow key={tokenId}>
                      <TableCell className="font-medium">
                        {displaySymbol}
                      </TableCell>
                      <TableCell>
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
                }
              )}

            {/* NFTs */}
            {walletBalance &&
              Object.entries(walletBalance.non_fungible_tokens).map(
                ([tokenId, token]) => {
                  const [, tokenSymbol] = tokenId.split("::");
                  const displaySymbol = tokenSymbol || "NFT";
                  return (
                    <TableRow key={tokenId}>
                      <TableCell className="font-medium">
                        {displaySymbol}
                      </TableCell>
                      <TableCell className="font-mono">{token.count}</TableCell>
                    </TableRow>
                  );
                }
              )}

            {/* Show empty state if no balances */}
            {(!walletBalance ||
              (Object.entries(walletBalance.fungible_tokens).length === 0 &&
                Object.entries(walletBalance.non_fungible_tokens).length ===
                  0 &&
                !walletBalance.stx)) && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-muted-foreground"
                >
                  No balances found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
