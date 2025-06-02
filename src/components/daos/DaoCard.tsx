"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import type { DAO, Token, Holder } from "@/types/supabase";
import { Loader } from "@/components/reusables/Loader";
import {
  LineChart,
  Line,
  Tooltip as RechartsTooltip,
  XAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { formatNumber } from "@/helpers/format-utils";

interface DAOCardProps {
  dao: DAO;
  token?: Token;
  tokenPrice?: {
    price: number;
    marketCap: number;
    holders: number;
    price24hChanges: number | null;
  };
  isFetchingPrice: boolean;
  trades: {
    data: Array<{ timestamp: number; price: number }>;
    isLoading: boolean;
  };
  holders: {
    data: {
      holders: Holder[];
      totalSupply: number;
      holderCount: number;
    } | null;
    isLoading: boolean;
  };
}

const truncateName = (name: string, maxLength = 20) => {
  return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
};

export const DAOCard = ({
  dao,
  token,
  tokenPrice,
  isFetchingPrice,
  trades,
  holders,
}: DAOCardProps) => {
  const getChartColor = (data: Array<{ timestamp: number; price: number }>) => {
    if (data.length < 2) return "#8884d8";
    const startPrice = data[0].price;
    const endPrice = data[data.length - 1].price;
    return endPrice >= startPrice ? "#22c55e" : "#ef4444";
  };

  const renderChart = (tradeData: {
    data: Array<{ timestamp: number; price: number }>;
    isLoading: boolean;
  }) => {
    if (tradeData.isLoading) {
      return (
        <div className="flex h-16 items-center justify-center">
          <Loader />
        </div>
      );
    }
    if (tradeData.data.length > 0) {
      return (
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={tradeData.data}>
            <XAxis dataKey="timestamp" hide />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (
                  active &&
                  payload &&
                  payload.length > 0 &&
                  payload[0].value !== undefined
                ) {
                  return (
                    <div className="bg-card text-muted-foreground rounded-lg shadow-lg p-3 text-xs border border-border">
                      <p>Price: ${Number(payload[0].value).toFixed(8)}</p>
                      <p>
                        Time:{" "}
                        {new Date(
                          payload[0].payload.timestamp,
                        ).toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={getChartColor(tradeData.data)}
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <div className="flex h-16 items-center justify-center">
        <BarChart className="h-4 w-4 text-muted opacity-50" />
        <span className="ml-2 text-xs text-muted-foreground">No data</span>
      </div>
    );
  };

  const renderPriceChange = (change: number | null | undefined) => {
    if (change === null || change === undefined) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-sm">0%</span>
        </div>
      );
    }

    const isPositive = change > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <div
        className={`flex items-center gap-1 ${
          isPositive ? "text-green-500" : "text-destructive"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="text-sm font-medium">
          {Math.abs(change).toFixed(2)}%
        </span>
      </div>
    );
  };

  const getHolderCount = () => {
    if (holders?.isLoading) {
      return <Loader />;
    }

    if (holders?.data?.holderCount) {
      return holders.data.holderCount.toLocaleString();
    }

    return tokenPrice?.holders?.toLocaleString() || "—";
  };

  return (
    <Link href={`/daos/${encodeURIComponent(dao.name)}`}>
      <Card className="group h-full hover:shadow-lg transition-all duration-150 bg-card border-border hover:border-primary/50 cursor-pointer shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20">
                <Image
                  src={token?.image_url || dao.image_url || "/placeholder.svg"}
                  alt={dao.name}
                  width={48}
                  height={48}
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-150 truncate">
                        {truncateName(dao.name)}
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{dao.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-6">
            {/* Price Chart */}
            <div className="bg-background rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Price Trend
                </span>
                {renderPriceChange(tokenPrice?.price24hChanges)}
              </div>
              {renderChart(trades)}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-background rounded-xl border border-border">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Price</span>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {isFetchingPrice ? (
                    <Loader />
                  ) : tokenPrice?.price ? (
                    `$${formatNumber(tokenPrice.price)}`
                  ) : (
                    "—"
                  )}
                </div>
              </div>

              <div className="text-center p-3 bg-background rounded-xl border border-border">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Holders</span>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {getHolderCount()}
                </div>
              </div>

              <div className="text-center p-3 bg-background rounded-xl border border-border">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Market Cap</span>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {isFetchingPrice ? (
                    <Loader />
                  ) : tokenPrice?.marketCap ? (
                    `$${formatNumber(tokenPrice.marketCap)}`
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Created {new Date(dao.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
