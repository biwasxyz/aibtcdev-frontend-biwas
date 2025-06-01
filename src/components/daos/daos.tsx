"use client";
import { useCallback, useState, useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";

import {
  FilterSidebar,
  type FilterConfig,
  type FilterState,
  type SummaryStats,
} from "@/components/reusables/FilterSidebar";
import { DAOCard } from "@/components/daos/DaoCard";
import type { DAO, SortField } from "@/types/supabase";
import {
  fetchDAOsWithExtension,
  fetchTokens,
  fetchTokenPrices,
  fetchTokenTrades,
  fetchHolders,
} from "@/queries/dao-queries";

export default function DAOs() {
  const [filterState, setFilterState] = useState<FilterState>({
    search: "",
    sort: "newest",
    category: "all",
    status: "all",
  });

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
      (ext) => ext.type === "dex" || ext.type === "TOKEN_DEX"
    );
    const dexPrincipal = dexExtension?.contract_principal;
    return dexPrincipal ? dexPrincipal.replace(/-dex$/, "") : null;
  }, []);

  // Fetch token trades for all DAOs
  const tradeQueries = useQueries({
    queries: (daos || []).map((dao) => {
      const tokenContract = getTokenContract(dao);
      return {
        queryKey: ["tokenTrades", dao.id],
        queryFn: async () => {
          if (!tokenContract) return [];
          return fetchTokenTrades(tokenContract).then((trades) =>
            trades
              .map((trade) => ({
                timestamp: trade.timestamp,
                price: trade.pricePerToken,
              }))
              .sort((a, b) => a.timestamp - b.timestamp)
          );
        },
        enabled: !!tokenContract && !!dao.id,
      };
    }),
  });

  // Fetch detailed holders data for all DAOs
  const holdersQueries = useQueries({
    queries: (daos || []).map((dao) => {
      const token = tokens?.find((t) => t.dao_id === dao.id);
      return {
        queryKey: ["holders", dao.id],
        queryFn: async () => {
          if (!token?.contract_principal || !token?.symbol) return null;
          try {
            const holdersData = await fetchHolders(
              token.contract_principal,
              token.symbol
            );
            return holdersData;
          } catch (error) {
            console.error(`Error fetching holders for DAO ${dao.id}:`, error);
            return null;
          }
        },
        enabled: !!token?.contract_principal && !!token?.symbol,
      };
    }),
  });

  // Create a map of holders data for each DAO
  const holdersMap = Object.fromEntries(
    holdersQueries.map((query, index) => [
      daos?.[index]?.id,
      {
        data: query.data,
        isLoading: query.isLoading,
      },
    ])
  );

  // Create a map of trades data for each DAO
  const tradesMap = Object.fromEntries(
    tradeQueries.map((query, index) => [
      daos?.[index]?.id,
      {
        data: query.data || [],
        isLoading: query.isLoading,
      },
    ])
  );

  // Get unique categories for filtering
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        daos
          ?.map((dao) => dao.extensions?.map((ext) => ext.type))
          .flat()
          .filter(Boolean) || []
      )
    ).sort();
  }, [daos]);

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: "search",
      label: "Search",
      type: "search",
      placeholder: "Search DAOs...",
    },
    {
      key: "category",
      label: "Category",
      type: "select",
      options: [
        { value: "all", label: "All Categories" },
        ...categories.map((category) => ({
          value: category!,
          label: category!.replace(/_/g, " ").toLowerCase(),
          badge: true,
        })),
      ],
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active", badge: true },
        { value: "inactive", label: "Inactive", badge: true },
      ],
    },
    {
      key: "sort",
      label: "Sort By",
      type: "select",
      options: [
        { value: "newest", label: "Newest" },
        { value: "oldest", label: "Oldest" },
        { value: "holders", label: "Holders" },
        { value: "price", label: "Token Price" },
        { value: "price24hChanges", label: "24h Change" },
        { value: "marketCap", label: "Market Cap" },
      ],
    },
  ];

  // Filter and sort DAOs
  const filteredAndSortedDAOs = useMemo(() => {
    const filtered =
      daos?.filter((dao) => {
        const searchQuery = filterState.search as string;
        const categoryFilter = filterState.category as string;
        const statusFilter = filterState.status as string;

        const matchesSearch =
          !searchQuery ||
          dao.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dao.mission.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          categoryFilter === "all" ||
          dao.extensions?.some((ext) => ext.type === categoryFilter);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" &&
            dao.extensions &&
            dao.extensions.length > 0) ||
          (statusFilter === "inactive" &&
            (!dao.extensions || dao.extensions.length === 0));

        return matchesSearch && matchesCategory && matchesStatus;
      }) || [];

    const sortField = filterState.sort as SortField;
    return filtered.sort((a, b) => {
      if (sortField === "created_at" || sortField === "newest") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      if (sortField === "oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      if (sortField === "holders") {
        const holdersA =
          holdersMap[a.id]?.data?.holderCount ||
          tokenPrices?.[a.id]?.holders ||
          0;
        const holdersB =
          holdersMap[b.id]?.data?.holderCount ||
          tokenPrices?.[b.id]?.holders ||
          0;
        return holdersB - holdersA;
      }
      const valueA = tokenPrices?.[a.id]?.[sortField] ?? 0;
      const valueB = tokenPrices?.[b.id]?.[sortField] ?? 0;
      return valueB - valueA;
    });
  }, [daos, filterState, holdersMap, tokenPrices]);

  // Calculate summary stats
  const totalDAOs = filteredAndSortedDAOs.length;
  const activeDAOs = filteredAndSortedDAOs.filter(
    (dao) => dao.extensions && dao.extensions.length > 0
  ).length;
  const totalHolders = filteredAndSortedDAOs.reduce((sum, dao) => {
    const holders =
      holdersMap[dao.id]?.data?.holderCount ||
      tokenPrices?.[dao.id]?.holders ||
      0;
    return sum + holders;
  }, 0);
  const totalMarketCap = filteredAndSortedDAOs.reduce((sum, dao) => {
    return sum + (tokenPrices?.[dao.id]?.marketCap || 0);
  }, 0);

  // Summary stats for sidebar
  const summaryStats: SummaryStats = {
    total: {
      label: "Total DAOs",
      value: totalDAOs,
    },
    active: {
      label: "Active DAOs",
      value: activeDAOs,
    },
    holders: {
      label: "Total Holders",
      value: totalHolders,
      format: (value) => Number(value).toLocaleString(),
    },
    marketCap: {
      label: "Total Market Cap",
      value: totalMarketCap,
      format: (value) => `$${Number(value).toLocaleString()}`,
    },
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full min-h-screen bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <FilterSidebar
            title="Filters"
            filters={filterConfig}
            filterState={filterState}
            onFilterChange={handleFilterChange}
            summaryStats={summaryStats}
          />

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">AI DAOs</h2>
                  <p className="text-zinc-400 mt-1">
                    Explore innovative decentralized organizations powered by AI
                  </p>
                </div>
              </div>
            </div>

            {isLoadingDAOs ? (
              <div className="flex min-h-[50vh] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
                  <p className="text-zinc-400">Loading AI DAOs...</p>
                </div>
              </div>
            ) : filteredAndSortedDAOs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#2A2A2A] rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-zinc-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No DAOs found
                </h3>
                <p className="text-zinc-400 max-w-md mx-auto">
                  Try adjusting your search terms or filters to discover more
                  AI-powered DAOs.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedDAOs.map((dao) => (
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
