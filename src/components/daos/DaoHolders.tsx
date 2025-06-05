"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sortedHolders.map((holder, index) => (
              <Card
                key={holder.address}
                className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4 space-y-3"
              >
                <CardContent className="p-0 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">#{index + 1}</span>
                    <TokenBalance
                      value={holder.balance}
                      symbol={tokenSymbol}
                      variant="rounded"
                    />
                  </div>
                  <code className="block break-all text-xs text-muted-foreground">
                    {holder.address}
                  </code>
                  <div className="text-right text-sm font-semibold">
                    {holder.percentage.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
