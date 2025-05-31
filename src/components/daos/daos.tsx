"use client";
import { useCallback, useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("newest");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
  const categories = Array.from(
    new Set(
      daos
        ?.map((dao) => dao.extensions?.map((ext) => ext.type))
        .flat()
        .filter(Boolean) || []
    )
  );

  // Filter and sort DAOs
  const filteredAndSortedDAOs = (() => {
    let filtered =
      daos?.filter((dao) => {
        const matchesSearch =
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
  })();

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

  return (
    <div className="w-full min-h-screen bg-gray-900">
      {/* Header Banner with Gradient */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute top-16 right-8 w-12 h-12 bg-white rounded-full"></div>
          <div className="absolute bottom-8 left-1/3 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute bottom-4 right-1/4 w-8 h-8 bg-white rounded-full"></div>
        </div>
        <div className="relative px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto text-center">
            <Heading className="text-4xl sm:text-5xl font-bold text-white mb-4">
              AI-Powered DAOs
            </Heading>
            <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
              Discover and engage with innovative decentralized autonomous
              organizations powered by artificial intelligence
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span>Market Cap: ${totalMarketCap.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Total Holders: {totalHolders.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span>Active DAOs: {activeDAOs}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div className="lg:w-80 flex-shrink-0">
            <Card className="sticky top-4 bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Filters</h3>
                </div>

                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                      <Input
                        placeholder="Search DAOs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Category
                    </label>
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category || ""}>
                            <Badge variant="secondary" className="text-xs">
                              {category?.replace(/_/g, " ").toLowerCase()}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Status
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800 text-xs"
                          >
                            Active
                          </Badge>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Sort By
                    </label>
                    <Select
                      value={sortField}
                      onValueChange={(value) =>
                        setSortField(value as SortField)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="holders">Holders</SelectItem>
                        <SelectItem value="price">Token Price</SelectItem>
                        <SelectItem value="price24hChanges">
                          24h Change
                        </SelectItem>
                        <SelectItem value="marketCap">Market Cap</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Summary Stats Card */}
                <div className="mt-8 p-4 bg-gray-900 rounded-lg text-white">
                  <h4 className="font-semibold mb-3">Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total DAOs:</span>
                      <span className="font-bold">{totalDAOs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Active DAOs:</span>
                      <span className="font-bold">{activeDAOs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total Holders:</span>
                      <span className="font-bold">
                        {totalHolders.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Discover AI DAOs ({totalDAOs})
                  </h2>
                  <p className="text-gray-400 mt-1">
                    Explore innovative decentralized organizations powered by AI
                  </p>
                </div>
              </div>
            </div>

            {isLoadingDAOs ? (
              <div className="flex min-h-[50vh] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-400">Loading AI DAOs...</p>
                </div>
              </div>
            ) : filteredAndSortedDAOs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No DAOs found
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
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
