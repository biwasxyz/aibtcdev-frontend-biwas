"use client";

import { Copy, Check, ExternalLink, Wallet } from "lucide-react";
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
    <div className="w-full h-full p-6 border border-gray-600 rounded-lg bg-[#1A1A1A]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-bold text-white">Agent Account</h3>
        </div>

        {walletAddress ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0" />

              {/* Address */}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-white truncate">
                  {walletAddress}
                </p>
                <p className="text-xs text-gray-400">Agent Wallet Address</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => copyToClipboard(walletAddress)}
                className="p-2 hover:bg-gray-700 rounded-md transition-colors"
                title="Copy address"
              >
                {copiedText === walletAddress ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400" />
                )}
              </button>
              <a
                href={getAddressExplorerUrl(walletAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-700 rounded-md transition-colors"
                title="View on explorer"
              >
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No wallet address</p>
            <p className="text-sm text-gray-500 mt-1">
              Agent wallet will appear here when configured
            </p>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto mt-6">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-white mb-2">
            Asset Balances
          </h4>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600">
              <TableHead className="w-1/3 text-gray-300">Asset</TableHead>
              <TableHead className="w-2/3 text-gray-300">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* STX Balance */}
            {walletBalance && (
              <TableRow className="border-gray-600">
                <TableCell className="font-medium text-white">STX</TableCell>
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
                    <TableRow key={tokenId} className="border-gray-600">
                      <TableCell className="font-medium text-white">
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
                },
              )}

            {/* NFTs */}
            {walletBalance &&
              Object.entries(walletBalance.non_fungible_tokens).map(
                ([tokenId, token]) => {
                  const [, tokenSymbol] = tokenId.split("::");
                  const displaySymbol = tokenSymbol || "NFT";
                  return (
                    <TableRow key={tokenId} className="border-gray-600">
                      <TableCell className="font-medium text-white">
                        {displaySymbol}
                      </TableCell>
                      <TableCell className="font-mono text-gray-300">
                        {token.count}
                      </TableCell>
                    </TableRow>
                  );
                },
              )}

            {/* Show empty state if no balances */}
            {(!walletBalance ||
              (Object.entries(walletBalance.fungible_tokens).length === 0 &&
                Object.entries(walletBalance.non_fungible_tokens).length ===
                  0 &&
                !walletBalance.stx)) && (
              <TableRow className="border-gray-600">
                <TableCell
                  colSpan={2}
                  className="text-center text-gray-400 py-8"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p>No balances found</p>
                    <p className="text-sm text-gray-500">
                      Asset balances will appear here
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
