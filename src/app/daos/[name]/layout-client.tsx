"use client";

import type React from "react";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Blocks,
  Users,
  Activity,
  Loader2,
  Info,
  Wallet,
  CoinsIcon as CoinIcon,
  Users2,
  FileText,
} from "lucide-react";
import {
  fetchToken,
  fetchDAOExtensions,
  fetchMarketStats,
  fetchTreasuryTokens,
  fetchTokenPrice,
  fetchHolders,
  fetchProposals,
  fetchDAOByName,
} from "@/queries/dao-queries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DAOCreationDate } from "@/components/daos/DaoCreationDate";
import { DAOSendProposal } from "@/components/daos/proposal/DAOSendProposal";

export function DAOLayoutClient({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const encodedName = params.name as string;
  const pathname = usePathname();

  // First, fetch the DAO by name to get its ID
  const { data: dao, isLoading: isLoadingDAOByName } = useQuery({
    queryKey: ["dao", encodedName],
    queryFn: () => fetchDAOByName(encodedName),
    staleTime: 600000, // 10 minutes
  });

  const id = dao?.id; // Get the ID from the fetched DAO

  // Determine which tab is active - update paths to use name instead of id
  const isProposals = pathname === `/daos/${encodedName}`;
  const isExtensions = pathname === `/daos/${encodedName}/extensions`;
  const isHolders = pathname === `/daos/${encodedName}/holders`;

  // Fetch token data - only if we have the DAO ID
  const { data: token, isLoading: isLoadingToken } = useQuery({
    queryKey: ["token", id],
    queryFn: () => fetchToken(id!),
    enabled: !!id, // Only run if we have the DAO ID
    staleTime: 600000, // 10 minutes
  });

  // Fetch extensions data - only if we have the DAO ID
  const { data: extensions, isLoading: isLoadingExtensions } = useQuery({
    queryKey: ["extensions", id],
    queryFn: () => fetchDAOExtensions(id!),
    enabled: !!id, // Only run if we have the DAO ID
    staleTime: 600000, // 10 minutes
  });

  const dex = extensions?.find((ext) => ext.type === "dex")?.contract_principal;
  const treasuryAddress = extensions?.find(
    (ext) => ext.type === "aibtc-treasury"
  )?.contract_principal;

  // Fetch token price
  const { data: tokenPrice, isLoading: isLoadingTokenPrice } = useQuery({
    queryKey: ["tokenPrice", dex],
    queryFn: () => fetchTokenPrice(dex!),
    enabled: !!dex,
  });

  // Fetch holders data
  const { data: holdersData, isLoading: isLoadingHolders } = useQuery({
    queryKey: ["holders", token?.contract_principal, token?.symbol],
    queryFn: () => fetchHolders(token!.contract_principal, token!.symbol),
    enabled: !!token?.contract_principal && !!token?.symbol,
    staleTime: 600000, // 10 minutes
  });

  // Fetch proposals
  const { data: proposals, isLoading: isLoadingProposals } = useQuery({
    queryKey: ["proposals", id],
    queryFn: () => fetchProposals(id!),
    enabled: !!id, // Only run if we have the DAO ID
    staleTime: 600000, // 10 minutes
  });

  // Fetch market stats
  const { data: marketStats, isLoading: isLoadingMarketStats } = useQuery({
    queryKey: [
      "marketStats",
      id,
      dex,
      token?.contract_principal,
      token?.symbol,
      token?.max_supply,
    ],
    queryFn: () =>
      fetchMarketStats(
        dex!,
        token!.contract_principal,
        token!.symbol,
        token!.max_supply || 0
      ),
    enabled: !!dex && !!token && !!token.contract_principal && !!token.symbol,
  });

  // Fetch treasury tokens
  const { data: treasuryTokens, isLoading: isLoadingTreasuryTokens } = useQuery(
    {
      queryKey: ["treasuryTokens", treasuryAddress, tokenPrice?.price],
      queryFn: () => fetchTreasuryTokens(treasuryAddress!, tokenPrice!.price),
      enabled: !!treasuryAddress && !!tokenPrice,
    }
  );

  // Check if we're loading basic DAO info
  const isBasicLoading = isLoadingDAOByName || isLoadingToken;

  // Check if we're loading overview-specific data
  const isOverviewLoading =
    isLoadingExtensions ||
    isLoadingTokenPrice ||
    isLoadingMarketStats ||
    isLoadingTreasuryTokens ||
    isLoadingHolders ||
    isLoadingProposals;

  // Format number helper function
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

  // Create enhanced market stats
  const enhancedMarketStats = marketStats
    ? {
        ...marketStats,
        holderCount: holdersData?.holderCount || marketStats.holderCount,
      }
    : {
        price: tokenPrice?.price || 0,
        marketCap: tokenPrice?.marketCap || 0,
        treasuryBalance: token?.max_supply
          ? token.max_supply * 0.8 * (tokenPrice?.price || 0)
          : 0,
        holderCount: holdersData?.holderCount || 0,
      };

  // Calculate total proposals
  const totalProposals = proposals ? proposals.length : 0;

  if (isBasicLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (!dao) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-gray-900">
        <div className="text-center space-y-2">
          <p className="text-xl font-medium text-gray-300">DAO not found</p>
          <p className="text-base text-gray-400">
            The DAO you&apos;re looking for doesn&apos;t exist or has been
            removed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#1A1A1A] min-h-screen">
      <div className="w-full py-6 flex-grow">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm sm:text-base text-zinc-400 mb-6 px-4 max-w-7xl mx-auto">
          <Link href="/daos" className="hover:text-white transition-colors">
            DAOs
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-white font-medium truncate">
            {dao?.name || "Details"}
          </span>
        </nav>

        {/* Main Content Grid */}
        <div className="px-4 max-w-7xl mx-auto">
          {/* DAO Header Section */}
          <div className="bg-[#2A2A2A] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-zinc-800 p-6 mb-6">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              {/* DAO Info */}
              <div className="flex flex-col sm:flex-row items-start gap-6 flex-1">
                {/* Token Image */}
                {token?.image_url && (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden border border-zinc-700 shadow-lg">
                    <Image
                      src={token.image_url || "/placeholder.svg"}
                      alt={`${dao?.name} token`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 80px, 96px"
                      priority
                    />
                  </div>
                )}
                {/* DAO Details */}
                <div className="flex-1 space-y-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {dao?.name}
                  </h1>
                  {dao?.mission && (
                    <div className="text-zinc-300 text-sm sm:text-base line-clamp-2">
                      {dao.mission}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-zinc-700 text-zinc-300 hover:text-white hover:border-[#FF6B00] transition-all duration-200"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      View Mission
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-lg bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90 transition-all duration-200"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Proposal
                    </Button>
                  </div>
                </div>
              </div>

              {/* Key Metrics - Inline */}
              <div className="lg:min-w-[400px]">
                {isOverviewLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton
                        key={i}
                        className="h-16 w-full rounded-lg bg-zinc-700"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1A1A1A] rounded-lg p-3 border border-zinc-800 hover:border-[#FF6B00] transition-colors duration-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CoinIcon className="h-4 w-4 text-[#FF6B00]" />
                        <span className="text-xs text-zinc-400">Price</span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {formatNumber(enhancedMarketStats.price, true)}
                      </span>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-lg p-3 border border-zinc-800 hover:border-[#FF6B00] transition-colors duration-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="h-4 w-4 text-[#FF6B00]" />
                        <span className="text-xs text-zinc-400">
                          Market Cap
                        </span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {formatNumber(enhancedMarketStats.marketCap)}
                      </span>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-lg p-3 border border-zinc-800 hover:border-[#FF6B00] transition-colors duration-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Users2 className="h-4 w-4 text-[#FF6B00]" />
                        <span className="text-xs text-zinc-400">Holders</span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {enhancedMarketStats.holderCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-lg p-3 border border-zinc-800 hover:border-[#FF6B00] transition-colors duration-200">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-[#FF6B00]" />
                        <span className="text-xs text-zinc-400">Proposals</span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {totalProposals}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Tabs - Integrated */}
            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-zinc-800">
              <Link href={`/daos/${encodedName}`}>
                <div
                  className={`flex items-center gap-2 pb-2 border-b-2 transition-all duration-200 ${
                    isProposals
                      ? "border-[#FF6B00] text-white font-semibold"
                      : "border-transparent text-zinc-400 hover:text-white hover:border-[#FF6B00]"
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Proposals</span>
                </div>
              </Link>
              <Link href={`/daos/${encodedName}/extensions`}>
                <div
                  className={`flex items-center gap-2 pb-2 border-b-2 transition-all duration-200 ${
                    isExtensions
                      ? "border-[#FF6B00] text-white font-semibold"
                      : "border-transparent text-zinc-400 hover:text-white hover:border-[#FF6B00]"
                  }`}
                >
                  <Blocks className="h-4 w-4" />
                  <span className="text-sm">Extensions</span>
                </div>
              </Link>
              <Link href={`/daos/${encodedName}/holders`}>
                <div
                  className={`flex items-center gap-2 pb-2 border-b-2 transition-all duration-200 ${
                    isHolders
                      ? "border-[#FF6B00] text-white font-semibold"
                      : "border-transparent text-zinc-400 hover:text-white hover:border-[#FF6B00]"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Holders</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Main Content Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-[#2A2A2A] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-zinc-800 p-6">
                {children}
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Send On-chain Message */}
              <div className="bg-[#2A2A2A] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-zinc-800 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Send Message
                </h3>
                <DAOSendProposal daoId={id!} />
              </div>

              {/* Treasury Holdings */}
              {!isOverviewLoading &&
                treasuryTokens &&
                treasuryTokens.length > 0 && (
                  <div className="bg-[#2A2A2A] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-zinc-800 p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Treasury
                    </h3>
                    <div className="space-y-2">
                      {treasuryTokens.slice(0, 3).map((token, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-xs"
                        >
                          <span className="text-zinc-400">{token.symbol}</span>
                          <span className="text-white font-medium">
                            {formatNumber(token.amount)}
                          </span>
                        </div>
                      ))}
                      {treasuryTokens.length > 3 && (
                        <div className="text-xs text-zinc-500 text-center pt-1">
                          +{treasuryTokens.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Creation Date */}
              {!isOverviewLoading && (
                <div className="text-center text-xs text-zinc-500">
                  <DAOCreationDate createdAt={dao.created_at} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
