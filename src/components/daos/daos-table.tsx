"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { DAO, Token } from "@/types/supabase";
import { Loader } from "../reusables/loader";
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
import { DAOBuyToken } from "./dao-buy-token";

interface DAOTableProps {
  daos: DAO[];
  tokens?: Token[];
  tokenPrices?: Record<
    string,
    {
      price: number;
      marketCap: number;
      holders: number;
      price24hChanges: number | null;
    }
  >;
  isFetchingPrice: boolean;
  trades: Record<
    string,
    {
      data: Array<{ timestamp: number; price: number }>;
      isLoading: boolean;
    }
  >;
}

const formatNumber = (num: number) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

export const DAOTable = ({
  daos,
  tokens,
  tokenPrices,
  isFetchingPrice,
  trades,
}: DAOTableProps) => {
  const getChartColor = (data: Array<{ timestamp: number; price: number }>) => {
    if (data.length < 2) return "#8884d8";
    const startPrice = data[0].price;
    const endPrice = data[data.length - 1].price;
    return endPrice >= startPrice ? "#22c55e" : "#ef4444";
  };

  const renderChart = (
    tradeData: {
      data: Array<{ timestamp: number; price: number }>;
      isLoading: boolean;
    },
    compact = false
  ) => {
    if (tradeData.isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader />
        </div>
      );
    }
    if (tradeData.data.length > 0) {
      return (
        <ResponsiveContainer width="100%" height={compact ? 60 : 100}>
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
                    <div className="bg-popover text-popover-foreground rounded-md shadow-md p-2 text-xs">
                      <p>Price: ${Number(payload[0].value).toFixed(8)}</p>
                      <p>
                        Time:{" "}
                        {new Date(
                          payload[0].payload.timestamp
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
      <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
        No data
      </div>
    );
  };

  const renderPriceChange = (change: number | null | undefined) => {
    if (change === null || change === undefined) return "0.00%";

    const isPositive = change > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <div
        className={`flex items-center gap-1 ${
          isPositive ? "text-green-500" : "text-red-500"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{Math.abs(change).toFixed(2)}%</span>
      </div>
    );
  };

  const truncateMission = (mission: string, maxLength = 100) => {
    if (!mission) return "";
    return mission.length > maxLength
      ? `${mission.substring(0, maxLength)}...`
      : mission;
  };

  const renderDAOCard = (dao: DAO) => {
    const token = tokens?.find((t) => t.dao_id === dao.id);
    const tokenPrice = tokenPrices?.[dao.id];
    // const dexPrincipal = getDexPrincipal(dao);
    const tradeData = trades[dao.id];

    return (
      <Card key={dao.id} className="overflow-hidden h-full">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-md flex-shrink-0">
                <Image
                  src={
                    token?.image_url ||
                    dao.image_url ||
                    "/placeholder.svg?height=40&width=40" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg"
                  }
                  alt={dao.name}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/daos/${dao.id}`}
                    className="font-medium hover:text-primary text-sm"
                  >
                    {dao.name}
                  </Link>
                  {dao.is_graduated && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1 py-0 h-4"
                    >
                      Graduated
                    </Badge>
                  )}
                </div>
                {token?.symbol && (
                  <div className="text-xs text-muted-foreground">
                    ${token.symbol}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DAOBuyToken daoId={dao.id} />
            </div>
          </div>

          <div className="p-3 border-b">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {truncateMission(dao.mission)}
            </p>
          </div>

          <Tabs
            defaultValue="overview"
            className="w-full flex-grow flex flex-col"
          >
            <TabsList className="w-full grid grid-cols-2 rounded-none border-b h-9">
              <TabsTrigger value="overview" className="text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="chart" className="text-xs">
                Chart
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="overview"
              className="p-3 pt-2 flex-grow flex flex-col justify-center"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs h-full">
                <div>
                  <div className="text-muted-foreground">Price</div>
                  <div className="font-medium">
                    {isFetchingPrice ? (
                      <Loader />
                    ) : (
                      `$${tokenPrice?.price?.toFixed(8) || "0.00000000"}`
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">24h Change</div>
                  <div className="font-medium">
                    {isFetchingPrice ? (
                      <Loader />
                    ) : (
                      renderPriceChange(tokenPrice?.price24hChanges)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Market Cap</div>
                  <div className="font-medium">
                    {isFetchingPrice ? (
                      <Loader />
                    ) : (
                      `$${formatNumber(tokenPrice?.marketCap || 0)}`
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Holders</div>
                  <div className="font-medium">
                    {isFetchingPrice ? <Loader /> : tokenPrice?.holders || 0}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent
              value="chart"
              className="p-3 flex-grow flex items-center justify-center"
            >
              {renderChart(tradeData)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="hidden md:block overflow-x-auto rounded-lg border w-full">
        <table className="w-full min-w-[1000px] border-collapse text-sm table-fixed">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium text-xs">DAO</th>
              <th className="p-3 text-left font-medium text-xs">Mission</th>
              <th className="p-3 text-center font-medium text-xs">Chart</th>
              <th className="p-3 text-right font-medium text-xs">Price</th>
              <th className="p-3 text-right font-medium text-xs">24h Change</th>
              <th className="p-3 text-right font-medium text-xs">Market Cap</th>
              <th className="p-3 text-right font-medium text-xs">Holders</th>
              <th className="p-3 text-center font-medium text-xs">Action</th>
            </tr>
          </thead>
          <tbody>
            {daos.map((dao) => {
              const token = tokens?.find((t) => t.dao_id === dao.id);
              const tokenPrice = tokenPrices?.[dao.id];
              // const dexPrincipal = getDexPrincipal(dao);
              const tradeData = trades[dao.id];

              return (
                <tr
                  key={dao.id}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-8 w-8 overflow-hidden rounded-md flex-shrink-0">
                        <Image
                          src={
                            token?.image_url ||
                            dao.image_url ||
                            "/placeholder.svg?height=32&width=32" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          alt={dao.name}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/daos/${dao.id}`}
                            className="font-medium hover:text-primary text-sm"
                          >
                            {dao.name}
                          </Link>
                          {dao.is_graduated && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1 py-0 h-4"
                            >
                              Graduated
                            </Badge>
                          )}
                        </div>
                        {token?.symbol && (
                          <div className="text-xs text-muted-foreground">
                            ${token.symbol}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 w-[25%] max-w-[300px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground truncate">
                            {dao.mission}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]">
                          <p className="text-xs">{dao.mission}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="p-3 w-[15%]">
                    <div className="mx-auto h-16 w-[180px]">
                      {renderChart(tradeData, true)}
                    </div>
                  </td>
                  <td className="p-3 text-right font-medium">
                    {isFetchingPrice ? (
                      <Loader />
                    ) : (
                      `$${tokenPrice?.price?.toFixed(8) || "0.00000000"}`
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end">
                      {isFetchingPrice ? (
                        <Loader />
                      ) : (
                        renderPriceChange(tokenPrice?.price24hChanges)
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right font-medium">
                    {isFetchingPrice ? (
                      <Loader />
                    ) : (
                      `$${formatNumber(tokenPrice?.marketCap || 0)}`
                    )}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {isFetchingPrice ? (
                      <Loader />
                    ) : (
                      tokenPrice?.holders?.toLocaleString() || 0
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center">
                      <DAOBuyToken daoId={dao.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden grid gap-3">{daos.map(renderDAOCard)}</div>
    </div>
  );
};

export default DAOTable;
