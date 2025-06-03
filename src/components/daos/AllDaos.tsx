"use client";
import { useCallback, useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Search, Users, TrendingUp, Activity, Coins, BarChart3 } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";

import { DAOCard } from "@/components/daos/DaoCard";
import type { DAO, Holder } from "@/types/supabase";
import {
  fetchDAOsWithExtension,
  fetchTokens,
  fetchTokenPrices,
  fetchTokenTrades,
  fetchHolders,
} from "@/queries/dao-queries";

// Define TokenTrade interface locally since it's defined in queries but not exported
interface TokenTrade {
  txId: string;
  tokenContract: string;
  type: string;
  tokensAmount: number;
  ustxAmount: number;
  pricePerToken: number;
  maker: string;
  timestamp: number;
}

export default function DAOs() {
  // Fetch DAOs with TanStack Query
  const { data: daos, isLoading: isLoadingDAOs } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOsWithExtension,
  });

  // Fetch tokens with TanStack Query
  const { data: tokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: fetchTokens,
  });

  // Fetch token prices with TanStack Query
  const { data: tokenPrices, isFetching: isFetchingTokenPrices } = useQuery({
    queryKey: ["tokenPrices"],
    queryFn: () => fetchTokenPrices(daos || [], tokens || []),
    enabled: !!daos && !!tokens,
  });

  // Helper function to get dex principal and token contract
  const getTokenContract = useCallback((dao: DAO) => {
    const dexExtension = dao.extensions?.find(
      (ext) => ext.type === "dex" || ext.type === "TOKEN_DEX",
    );
    const dexPrincipal = dexExtension?.contract_principal;
    return dexPrincipal ? dexPrincipal.replace(/-dex$/, "") : null;
  }, []);

  // Fetch token trades using useQueries for parallel fetching
  const tradeQueries = useQueries({
    queries:
      daos?.map((dao) => {
        const tokenContract = getTokenContract(dao);
        return {
          queryKey: ["tokenTrades", dao.id, tokenContract],
          queryFn: () => fetchTokenTrades(tokenContract!),
          enabled: !!tokenContract,
          staleTime: 5 * 60 * 1000, // 5 minutes
        };
      }) || [],
  });

  // Fetch holders for each DAO
  const holderQueries = useQueries({
    queries:
      daos?.map((dao) => {
        return {
          queryKey: ["holders", dao.id],
          queryFn: () => fetchHolders(dao.id),
          enabled: !!dao.id,
          staleTime: 10 * 60 * 1000, // 10 minutes
        };
      }) || [],
  });

  // Transform trades data for easy access
  const tradesMap = useMemo(() => {
    const map: Record<
      string,
      { data: Array<{ timestamp: number; price: number }>; isLoading: boolean }
    > = {};
    daos?.forEach((dao, index) => {
      const query = tradeQueries[index];
      // Transform TokenTrade data to the expected format
      const transformedData = (query?.data || []).map((trade: TokenTrade) => ({
        timestamp: trade.timestamp,
        price: trade.pricePerToken,
      }));

      map[dao.id] = {
        data: transformedData,
        isLoading: query?.isLoading || false,
      };
    });
    return map;
  }, [daos, tradeQueries]);

  // Transform holders data for easy access
  const holdersMap = useMemo(() => {
    const map: Record<
      string,
      {
        data: {
          holders: Holder[];
          totalSupply: number;
          holderCount: number;
        } | null;
        isLoading: boolean;
      }
    > = {};
    daos?.forEach((dao, index) => {
      const query = holderQueries[index];
      map[dao.id] = {
        data: query?.data || null,
        isLoading: query?.isLoading || false,
      };
    });
    return map;
  }, [daos, holderQueries]);

  // Calculate summary stats
  const totalDAOs = daos?.length || 0;
  const activeDAOs =
    daos?.filter((dao) => dao.extensions && dao.extensions.length > 0).length ||
    0;
  const totalHolders =
    daos?.reduce((sum, dao) => {
      const holders =
        holdersMap[dao.id]?.data?.holderCount ||
        tokenPrices?.[dao.id]?.holders ||
        0;
      return sum + holders;
    }, 0) || 0;
  const totalMarketCap =
    daos?.reduce((sum, dao) => {
      return sum + (tokenPrices?.[dao.id]?.marketCap || 0);
    }, 0) || 0;

  const stats = [
    {
      icon: Activity,
      label: "Total DAOs",
      value: totalDAOs,
      color: "text-primary",
      bgColor: "from-primary/20 to-primary/10",
    },
    {
      icon: TrendingUp,
      label: "Active DAOs",
      value: activeDAOs,
      color: "text-emerald-500",
      bgColor: "from-emerald-500/20 to-emerald-500/10",
    },
    {
      icon: Users,
      label: "Total Holders",
      value: totalHolders.toLocaleString(),
      color: "text-blue-500",
      bgColor: "from-blue-500/20 to-blue-500/10",
    },
    {
      icon: Coins,
      label: "Market Cap",
      value: `$${totalMarketCap.toLocaleString()}`,
      color: "text-purple-500",
      bgColor: "from-purple-500/20 to-purple-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="space-y-16">
          {/* Hero Header Section */}
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6">
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                AI-Powered DAOs
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Discover autonomous organizations powered by artificial intelligence, 
                driving the future of decentralized governance and innovation.
              </p>
            </div>
          </div>

          {/* Metrics Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-border/80 transition-all duration-300 group"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DAOs Content Section */}
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                Active Organizations
              </h2>
              <p className="text-muted-foreground">
                {totalDAOs > 0 
                  ? `Explore ${totalDAOs} AI-powered autonomous organizations`
                  : 'Discover AI-powered autonomous organizations'
                }
              </p>
            </div>

            {/* DAOs Grid */}
            {isLoadingDAOs ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20">
                    <Loader />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium text-foreground">Loading AI DAOs</h3>
                    <p className="text-muted-foreground">
                      Fetching autonomous organizations and their data...
                    </p>
                  </div>
                </div>
              </div>
            ) : !daos || daos.length === 0 ? (
              <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50 py-24">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-muted/50">
                    <Search className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-medium text-foreground">
                      No DAOs Found
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                      No AI-powered DAOs are available at the moment. Check back later for new autonomous organizations.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {daos.map((dao) => (
                  <DAOCard
                    key={dao.id}
                    dao={dao}
                    token={tokens?.find((t) => t.dao_id === dao.id)}
                    tokenPrice={tokenPrices?.[dao.id]}
                    isFetchingPrice={isFetchingTokenPrices}
                    trades={tradesMap[dao.id]}
                    holders={holdersMap[dao.id]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
