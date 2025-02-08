import { useCallback, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { BsTwitterX } from "react-icons/bs";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DAO, Token } from "@/types/supabase";
import { Loader } from "../reusables/loader";
import { AgentSelectorSheet } from "./DaoAgentSelector";
import { LineChart, Line, ResponsiveContainer } from "recharts";

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
  isFetchingPrice?: boolean;
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
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [participatingDaoId, setParticipatingDaoId] = useState<string | null>(
    null
  );

  const getDexPrincipal = useCallback((dao: DAO) => {
    const dexExtension = dao.extensions?.find((ext) => ext.type === "dex");
    return dexExtension?.contract_principal || "";
  }, []);

  const handleParticipate = (daoId: string) => {
    setParticipatingDaoId(daoId);
  };

  const handleAgentSelect = (agentId: string | null) => {
    setSelectedAgentId(agentId);
    setParticipatingDaoId(null);
  };

  const getChartColor = (data: Array<{ timestamp: number; price: number }>) => {
    if (data.length < 2) return "#8884d8";
    const startPrice = data[0].price;
    const endPrice = data[data.length - 1].price;
    return endPrice >= startPrice ? "#22c55e" : "#ef4444";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-4 text-left font-medium">DAO</th>
            <th className="p-4 text-left font-medium">Price Info</th>
            <th className="p-4 text-left font-medium">Price History</th>
            <th className="p-4 text-left font-medium">Holders</th>
            <th className="p-4 text-left font-medium">Prompted By</th>
            <th className="p-4 text-left font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {daos.map((dao) => {
            const token = tokens?.find((t) => t.dao_id === dao.id);
            const tokenPrice = tokenPrices?.[dao.id];
            const dexPrincipal = getDexPrincipal(dao);
            const tradeData = trades[dao.id];
            const isPriceUp =
              tokenPrice?.price24hChanges != null &&
              tokenPrice.price24hChanges > 0;
            const isPriceDown =
              tokenPrice?.price24hChanges != null &&
              tokenPrice.price24hChanges < 0;

            return (
              <tr key={dao.id} className="border-b hover:bg-zinc-900">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                      <Image
                        src={
                          token?.image_url ||
                          dao.image_url ||
                          "/placeholder.svg"
                        }
                        alt={dao.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <Link href={`/daos/${dao.id}`}>
                        <span className="font-medium hover:text-primary">
                          {dao.name}
                        </span>
                      </Link>
                      {dao.is_graduated && (
                        <Badge variant="secondary" className="ml-2">
                          Graduated
                        </Badge>
                      )}
                      {token?.symbol && (
                        <div className="text-xs text-muted-foreground">
                          ${token.symbol}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  {isFetchingPrice ? (
                    <Loader />
                  ) : (
                    <div className="space-y-1">
                      <div className="text-lg font-semibold">
                        Token Price: ${tokenPrice?.price?.toFixed(8) || "0.00"}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1 ${
                            isPriceUp
                              ? "text-green-500"
                              : isPriceDown
                              ? "text-red-500"
                              : "text-gray-500"
                          }`}
                        >
                          24hrChange:
                          {isPriceUp ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : isPriceDown ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : null}
                          <span>
                            {tokenPrice?.price24hChanges != null
                              ? `${Math.abs(tokenPrice.price24hChanges).toFixed(
                                  2
                                )}%`
                              : "0.00%"}
                          </span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">
                          MCap: ${formatNumber(tokenPrice?.marketCap || 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <div className="h-20 w-40">
                    {tradeData?.isLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <Loader />
                      </div>
                    ) : tradeData?.data.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tradeData.data}>
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke={getChartColor(tradeData.data)}
                            dot={false}
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        No trades
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {isFetchingPrice ? (
                    <Loader />
                  ) : (
                    <span className="text-gray-600">
                      {tokenPrice?.holders || 0}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {dao.user_id ? (
                    <Link
                      href={`https://x.com/i/user/${dao.user_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <BsTwitterX className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-4">
                  {dexPrincipal ? (
                    <Button size="sm" onClick={() => handleParticipate(dao.id)}>
                      Participate
                    </Button>
                  ) : (
                    <Button size="sm" disabled>
                      Participate
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <AgentSelectorSheet
        selectedAgentId={selectedAgentId}
        onSelect={handleAgentSelect}
        open={!!participatingDaoId}
        requiredTokenSymbol={
          tokens?.find((t) => t.dao_id === participatingDaoId)?.symbol
        }
        onOpenChange={(open) => {
          if (!open) setParticipatingDaoId(null);
        }}
        daos={daos}
        tokens={tokens}
      />
    </div>
  );
};

export default DAOTable;
