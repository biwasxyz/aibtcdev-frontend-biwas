"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DAOTable } from "./daos-table";
import type { SortField } from "@/types/supabase";
import { createDaoAgent } from "../agents/dao-agent";
import { useToast } from "@/hooks/use-toast";
import { fetchDAOs, fetchTokens, fetchTokenPrices } from "@/queries/daoQueries";

export default function DAOs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const { toast } = useToast();
  const agentInitialized = useRef(false);

  // Initialize DAO agent
  const initializeAgent = useCallback(async () => {
    if (agentInitialized.current) return;

    try {
      const agent = await createDaoAgent();
      if (agent) {
        toast({
          title: "DAO Agent Initialized",
          description: "Your DAO agent has been set up successfully.",
          variant: "default",
        });
        agentInitialized.current = true;
      }
    } catch (error) {
      console.error("Error initializing DAO agent:", error);
    }
  }, [toast]);

  useEffect(() => {
    initializeAgent();
  }, [initializeAgent]);

  // Fetch DAOs with TanStack Query
  const { data: daos, isLoading: isLoadingDAOs } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
    staleTime: 600000, // 10 minutes
  });

  // Fetch tokens with TanStack Query
  const { data: tokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: fetchTokens,
    staleTime: 600000, // 10 minutes
  });

  // Fetch token prices with TanStack Query
  const { data: tokenPrices, isFetching: isFetchingTokenPrices } = useQuery({
    queryKey: ["tokenPrices", daos, tokens],
    queryFn: () => fetchTokenPrices(daos || [], tokens || []),
    enabled: !!daos && !!tokens,
    staleTime: 600000, // 10 minutes
    refetchInterval: 300000, // Refetch every 5 minutes for price updates
  });

  // Filter and sort DAOs
  const filteredAndSortedDAOs = (() => {
    const filtered =
      daos?.filter(
        (dao) =>
          dao.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dao.mission.toLowerCase().includes(searchQuery.toLowerCase())
      ) || [];

    return filtered.sort((a, b) => {
      if (sortField === "created_at") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      const valueA = tokenPrices?.[a.id]?.[sortField] ?? 0;
      const valueB = tokenPrices?.[b.id]?.[sortField] ?? 0;
      return valueB - valueA;
    });
  })();

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="space-y-2">
            <Heading className="text-3xl font-bold sm:text-4xl">
              {!isLoadingDAOs && (
                <p className="text-sm text-muted-foreground">
                  Total AI DAOs: {filteredAndSortedDAOs.length}
                </p>
              )}
            </Heading>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={sortField}
              onValueChange={(value) => setSortField(value as SortField)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Added</SelectItem>
                <SelectItem value="price">Token Price</SelectItem>
                <SelectItem value="price24hChanges">24h Change</SelectItem>
                <SelectItem value="marketCap">Market Cap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search DAOs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoadingDAOs ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DAOTable
          daos={filteredAndSortedDAOs}
          tokens={tokens}
          tokenPrices={tokenPrices}
          isFetchingPrice={isFetchingTokenPrices}
        />
      )}

      {filteredAndSortedDAOs.length === 0 && !isLoadingDAOs && (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-center text-muted-foreground">
            No DAOs found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
