"use client";
import { useCallback, useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Search } from "lucide-react";
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

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        {/* Header Section */}
        <div className="mb-10">


          {/* Summary Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-card rounded-xl p-6 text-center border border-border shadow-sm">
              <div className="text-2xl font-bold text-foreground">{totalDAOs}</div>
              <div className="text-sm text-muted-foreground mt-2">Total DAOs</div>
            </div>
            <div className="bg-card rounded-xl p-6 text-center border border-border shadow-sm">
              <div className="text-2xl font-bold text-primary">
                {activeDAOs}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Active DAOs</div>
            </div>
            <div className="bg-card rounded-xl p-6 text-center border border-border shadow-sm">
              <div className="text-2xl font-bold text-foreground">
                {totalHolders.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Total Holders</div>
            </div>
            <div className="bg-card rounded-xl p-6 text-center border border-border shadow-sm">
              <div className="text-2xl font-bold text-foreground">
                ${totalMarketCap.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Total Market Cap</div>
            </div>
          </div>
        </div>

        {/* DAOs Grid */}
        {isLoadingDAOs ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <Loader />
              <p className="text-muted-foreground mt-4">Loading AI DAOs...</p>
            </div>
          </div>
        ) : !daos || daos.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-8 bg-card rounded-full flex items-center justify-center border border-border shadow-sm">
              <Search className="w-12 h-12 text-muted" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              No DAOs found
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              No AI-powered DAOs available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
  );
}
