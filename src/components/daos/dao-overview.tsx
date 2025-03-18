"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileText, Users } from "lucide-react";
import { BsGlobe, BsTwitterX, BsTelegram } from "react-icons/bs";
import type { DAO, Token, Proposal } from "@/types/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DAOCreationDate } from "./dao-creation-date";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "@/components/ui/badge";

interface Holder {
  address: string;
  balance: string;
  percentage: number;
  value_usd?: string;
  last_transaction?: string;
}

interface DAOOverviewProps {
  dao: DAO;
  token?: Token;
  treasuryTokens?: {
    type: "FT" | "NFT";
    name: string;
    symbol: string;
    amount: number;
    value: number;
  }[];
  marketStats?: {
    price: number;
    marketCap: number;
    treasuryBalance: number;
    holderCount: number;
  };
  proposals?: Proposal[];
  holders?: Holder[];
}

function DAOOverview({
  dao,
  treasuryTokens = [],
  marketStats = {
    price: 0,
    marketCap: 0,
    treasuryBalance: 0,
    holderCount: 0,
  },
  proposals = [],
  holders = [],
}: DAOOverviewProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const formatNumber = (num: number, isPrice = false) => {
    if (isPrice) {
      if (num === 0) return "$0.00";
      if (num < 0.01) return `$${num.toFixed(8)}`;
      return `$${num.toFixed(2)}`;
    }

    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Proposal statistics
  const proposalStats = {
    deployed: proposals.filter((p) => p.status === "DEPLOYED").length,
    pending: proposals.filter((p) => p.status === "PENDING").length,
    total: proposals.length,
    successRate: (() => {
      const completed = proposals.filter(
        (p) => p.status === "DEPLOYED" || p.status === "FAILED"
      );
      if (completed.length === 0) return 0;
      return Math.round(
        (proposals.filter((p) => p.status === "DEPLOYED").length /
          completed.length) *
          100
      );
    })(),
  };

  // Holder statistics
  const holderStats = {
    totalHolders: holders.length,
    top10Holdings: holders
      .slice(0, 10)
      .reduce((acc, holder) => acc + holder.percentage, 0)
      .toFixed(2),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header section */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground mt-2">
            Key information and statistics about the DAO
          </p>
        </div>

        {/* Social links */}
        <div className="flex gap-3 mb-4">
          {dao.website_url && (
            <a
              href={dao.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <BsGlobe className="h-5 w-5" />
            </a>
          )}
          {dao.x_url && (
            <a
              href={dao.x_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <BsTwitterX className="h-5 w-5" />
            </a>
          )}
          {dao.telegram_url && (
            <a
              href={dao.telegram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <BsTelegram className="h-5 w-5" />
            </a>
          )}
        </div>

        {/* Market Stats cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Token Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(marketStats.price, true)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(marketStats.marketCap)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treasury</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(marketStats.treasuryBalance)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Holders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketStats.holderCount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Proposal & Holder Stats Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Proposal Stats */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h3 className="text-lg font-medium">Proposal Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <h3 className="text-sm font-medium">Active Proposals</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="text-2xl font-bold">
                      {proposalStats.deployed}
                    </div>
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-primary/10 text-primary"
                    >
                      Deployed
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <h3 className="text-sm font-medium">Success Rate</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">
                      {proposalStats.successRate}%
                    </div>
                  </div>
                  <div className="w-full h-2 bg-secondary/10 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${proposalStats.successRate}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Holder Stats */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h3 className="text-lg font-medium">Holder Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <h3 className="text-sm font-medium">Total Holders</h3>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {holderStats.totalHolders}
                  </div>
                </CardContent>
              </Card>
              <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <h3 className="text-sm font-medium">Top 10 Holdings</h3>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {holderStats.top10Holdings}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* About section - only show if there's a description */}
        {dao.description && (
          <div className="space-y-4 rounded-lg border bg-background/50 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">About</h3>
              {dao.description.length > 200 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                  className="text-xs"
                >
                  {isDescriptionExpanded ? (
                    <>
                      Show Less <ChevronUp className="ml-1 h-3 w-3" />
                    </>
                  ) : (
                    <>
                      Show More <ChevronDown className="ml-1 h-3 w-3" />
                    </>
                  )}
                </Button>
              )}
            </div>
            <p
              className={`text-muted-foreground leading-relaxed ${
                !isDescriptionExpanded && dao.description.length > 200
                  ? "line-clamp-4"
                  : ""
              }`}
            >
              {dao.description}
            </p>
          </div>
        )}

        {/* Treasury Holdings */}
        {treasuryTokens.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-medium">Treasury Holdings</h3>
            <div className="rounded-lg border bg-background/50 backdrop-blur-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] sm:w-[100px]">
                      Type
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    {treasuryTokens.some((token) => token.value > 0) && (
                      <TableHead className="text-right">Value</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treasuryTokens.map((token, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {token.type}
                      </TableCell>
                      <TableCell className="max-w-[120px] sm:max-w-none truncate">
                        {token.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {token.symbol}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatNumber(token.amount)}
                      </TableCell>
                      {treasuryTokens.some((token) => token.value > 0) && (
                        <TableCell className="text-right whitespace-nowrap">
                          {token.value > 0 ? formatNumber(token.value) : "-"}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Creation Date */}
        <div className="p-4">
          <DAOCreationDate createdAt={dao.created_at} />
        </div>
      </div>
    </div>
  );
}

export { DAOOverview };
export default DAOOverview;
