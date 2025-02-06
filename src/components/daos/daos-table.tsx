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
}: DAOTableProps) => {
  console.log("Fetched DAOs:", daos);
  console.log("Fetched Tokens:", tokens);
  console.log("Fetched Token Prices:", tokenPrices);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [participatingDaoId, setParticipatingDaoId] = useState<string | null>(
    null
  );

  const getDexPrincipal = useCallback((dao: DAO) => {
    const dexExtension = dao.extensions?.find((ext) => ext.type === "dex");
    return dexExtension?.contract_principal || "";
  }, []);

  const handleParticipate = (daoId: string) => {
    console.log("Participating in DAO:", daoId);
    setParticipatingDaoId(daoId);
  };

  const handleAgentSelect = (agentId: string | null) => {
    console.log("Selected agent:", agentId);
    const token = tokens?.find((t) => t.dao_id === participatingDaoId);
    const tokenSymbol = token?.symbol;

    setSelectedAgentId(agentId);
    if (agentId && participatingDaoId) {
      const dao = daos.find((d) => d.id === participatingDaoId);
      // const dexPrincipal = getDexPrincipal(dao!);

      // console.log("Participation details:", {
      //   agentId,
      //   daoId: participatingDaoId,
      //   dexPrincipal,
      //   tokenSymbol,
      // });

      // alert(
      //   `Participating with Agent ID: ${agentId}\nDAO ID: ${participatingDaoId}\nContract Principal: ${dexPrincipal}\nToken Symbol: ${tokenSymbol}`
      // );
    }
    setParticipatingDaoId(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-3 text-left font-medium">DAO</th>
            <th className="p-3 text-left font-medium">Token Price</th>
            <th className="p-3 text-left font-medium">24h Change</th>
            <th className="p-3 text-left font-medium">Market Cap</th>
            <th className="p-3 text-left font-medium">Holders</th>
            <th className="p-3 text-left font-medium">Prompted By</th>
            <th className="p-3 text-left font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {daos.map((dao) => {
            const token = tokens?.find((t) => t.dao_id === dao.id);
            const tokenPrice = tokenPrices?.[dao.id];
            const dexPrincipal = getDexPrincipal(dao);

            return (
              <tr key={dao.id} className="border-b">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                      <Image
                        src={
                          token?.image_url ||
                          dao.image_url ||
                          "/placeholder.svg"
                        }
                        alt={dao.name}
                        width={40}
                        height={40}
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
                <td className="p-3">
                  {isFetchingPrice ? (
                    <Loader />
                  ) : (
                    <span>${tokenPrice?.price?.toFixed(8) || "0.00"}</span>
                  )}
                </td>
                <td className="p-3">
                  {isFetchingPrice ? (
                    <Loader />
                  ) : (
                    <div className="flex items-center gap-1">
                      {tokenPrice?.price24hChanges != null ? (
                        <>
                          {tokenPrice.price24hChanges > 0 ? (
                            <ArrowUp className="h-3 w-3 text-green-500" />
                          ) : tokenPrice.price24hChanges < 0 ? (
                            <ArrowDown className="h-3 w-3 text-red-500" />
                          ) : null}
                          <span
                            className={
                              tokenPrice.price24hChanges > 0
                                ? "text-green-500"
                                : tokenPrice.price24hChanges < 0
                                ? "text-red-500"
                                : ""
                            }
                          >
                            {Math.abs(tokenPrice.price24hChanges).toFixed(2)}%
                          </span>
                        </>
                      ) : (
                        "0.00%"
                      )}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {isFetchingPrice ? (
                    <Loader />
                  ) : (
                    <span>${formatNumber(tokenPrice?.marketCap || 0)}</span>
                  )}
                </td>
                <td className="p-3">
                  {isFetchingPrice ? (
                    <Loader />
                  ) : (
                    <span>{tokenPrice?.holders || 0}</span>
                  )}
                </td>
                <td className="p-3">
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
                <td className="p-3">
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
