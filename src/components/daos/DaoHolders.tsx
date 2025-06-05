"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUpDown } from "lucide-react";
import { TokenBalance } from "@/components/reusables/BalanceDisplay";

interface Holder {
  address: string;
  balance: string;
  percentage: number;
  value_usd?: string;
  last_transaction?: string;
}

interface DAOHoldersProps {
  holders: Holder[];
  tokenSymbol: string;
}

export default function DAOHolders({ holders, tokenSymbol }: DAOHoldersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("balance");

  const filteredHolders = useMemo(() => {
    return holders.filter((holder) =>
      holder.address.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [holders, searchQuery]);

  const sortedHolders = useMemo(() => {
    return [...filteredHolders].sort((a, b) => {
      switch (sortBy) {
        case "balance":
          return Number.parseFloat(b.balance) - Number.parseFloat(a.balance);
        case "percentage":
          return b.percentage - a.percentage;
        case "value":
          return (
            Number.parseFloat(b.value_usd || "0") -
            Number.parseFloat(a.value_usd || "0")
          );
        default:
          return 0;
      }
    });
  }, [filteredHolders, sortBy]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Token Holders</h2>
          <p className="text-muted-foreground mt-2">
            View and analyze the distribution of token holders
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance">Balance</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                {holders[0]?.value_usd && (
                  <SelectItem value="value">Value (USD)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] px-2 sm:px-4">Rank</TableHead>
                  <TableHead className="px-2 sm:px-4">Address</TableHead>
                  <TableHead className="text-right px-2 sm:px-4">Balance</TableHead>
                  <TableHead className="text-right px-2 sm:px-4">Percentage</TableHead>
                  {holders[0]?.value_usd && (
                    <TableHead className="text-right hidden md:table-cell px-2 sm:px-4">
                      Value (USD)
                    </TableHead>
                  )}
                  {holders[0]?.last_transaction && (
                    <TableHead className="hidden lg:table-cell px-2 sm:px-4">
                      Last Transaction
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHolders.map((holder, index) => (
                  <TableRow key={holder.address}>
                    <TableCell className="font-medium px-2 sm:px-4">{index + 1}</TableCell>
                    <TableCell className="break-all whitespace-normal px-2 sm:px-4">
                      <code className="text-xs break-all px-1.5 py-0.5 rounded">
                        {holder.address}
                      </code>
                    </TableCell>
                    <TableCell className="text-right tabular-nums px-2 sm:px-4">
                      <TokenBalance
                        value={holder.balance}
                        symbol={tokenSymbol}
                        variant="rounded"
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums px-2 sm:px-4">
                      {holder.percentage.toFixed(2)}%
                    </TableCell>
                    {holders[0]?.value_usd && (
                      <TableCell className="text-right tabular-nums hidden md:table-cell px-2 sm:px-4">
                        $
                        {Number.parseFloat(
                          holder.value_usd || "0",
                        ).toLocaleString()}
                      </TableCell>
                    )}
                    {holders[0]?.last_transaction && (
                      <TableCell className="hidden lg:table-cell break-all px-2 sm:px-4">
                        {holder.last_transaction}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
