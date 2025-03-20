"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
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
        <div className="flex gap-3">
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
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <CardWithBadge
            title="Token Price"
            value={formatNumber(marketStats.price, true)}
          />
          <CardWithBadge
            title="Market Cap"
            value={formatNumber(marketStats.marketCap)}
          />
          <CardWithBadge
            title="Treasury"
            value={formatNumber(marketStats.treasuryBalance)}
          />
          <CardWithBadge
            title="Total Holders"
            value={marketStats.holderCount.toLocaleString()}
          />
        </div>

        {/* Proposal Stats Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-medium">Proposal Stats</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CardWithBadge
              title="Total Proposals"
              value={proposalStats.total.toString()}
            />
            <CardWithBadge
              title="Deployed Proposals"
              value={proposalStats.deployed.toString()}
              badge={{
                text: "Deployed",
                variant: "secondary",
                className: "bg-primary/10 text-primary",
              }}
            />
            <CardWithBadge
              title="Pending Proposals"
              value={proposalStats.pending.toString()}
              badge={{
                text: "Pending",
                variant: "secondary",
                className: "bg-amber-500/10 text-amber-500",
              }}
            />
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

// Single, unified card component that can optionally display a badge
interface CardWithBadgeProps {
  title: string;
  value: string;
  badge?: {
    text: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  };
}

function CardWithBadge({ title, value, badge }: CardWithBadgeProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {badge && (
            <Badge variant={badge.variant} className={badge.className}>
              {badge.text}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { DAOOverview };
export default DAOOverview;
