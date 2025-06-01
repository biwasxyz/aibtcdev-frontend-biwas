"use client";

import type React from "react";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Blocks,
  Users,
  Activity,

  Info,
  Wallet,
  CoinsIcon as CoinIcon,
  Users2,
  FileText,
} from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
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
import { Skeleton } from "@/components/ui/skeleton";
import { DAOSendProposal } from "@/components/daos/proposal/DAOSendProposal";
import { DAOBuyToken } from "@/components/daos/DaoBuyToken";

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
  const isMission = pathname === `/daos/${encodedName}/mission`;

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
    (ext) => ext.type === "aibtc-treasury",
  )?.contract_principal;

  // Fetch token price
  const { data: tokenPrice, isLoading: isLoadingTokenPrice } = useQuery({
    queryKey: ["tokenPrice", dex],
    queryFn: () => fetchTokenPrice(dex!),
    enabled: !!dex,
  });

  // Fetch holders data
  const { data: holdersData, isLoading: isLoadingHolders } = useQuery({
    queryKey: ["holders", id],
    queryFn: () => fetchHolders(id!),
    enabled: !!id,
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
      token?.max_supply,
    ],
    queryFn: () =>
      fetchMarketStats(
        dex!,
        id!,
        token!.max_supply || 0,
      ),
    enabled: !!dex && !!id && !!token,
  });

  // Fetch treasury tokens
  const { isLoading: isLoadingTreasuryTokens } = useQuery({
    queryKey: ["treasuryTokens", treasuryAddress, tokenPrice?.price],
    queryFn: () => fetchTreasuryTokens(treasuryAddress!, tokenPrice!.price),
    enabled: !!treasuryAddress && !!tokenPrice,
  });

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
        <Loader />
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
        {/* Main Content Grid */}
        <div className="px-4 max-w-7xl mx-auto">
          {/* DAO Header Section */}
          <div className="bg-[#2A2A2A] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-zinc-800 mb-6 overflow-hidden">
            {/* Main Header Content */}
            <div className="p-6">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                {/* DAO Info - Left Side */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Token Image */}
                  {token?.image_url && (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border border-zinc-700 shadow-lg">
                      <Image
                        src={token.image_url || "/placeholder.svg"}
                        alt={`${dao?.name} token`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 64px, 80px"
                        priority
                      />
                    </div>
                  )}
                  {/* DAO Details */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 truncate">
                      {dao?.name}
                    </h1>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-[#FF6B00]/20 text-[#FF6B00] rounded-full border border-[#FF6B00]/30">
                          Active DAO
                        </span>
                        <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded-full">
                          {token?.symbol || "N/A"}
                        </span>
                      </div>
                      
                      {/* Buy Token Button */}
                      {id && (
                        <div className="flex">
                          <DAOBuyToken daoId={id} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Metrics - Right Side */}
                <div className="w-full lg:w-auto lg:min-w-[320px]">
                  {isOverviewLoading ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-14 w-full rounded-lg bg-zinc-700"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#1A1A1A] rounded-lg p-3 border border-zinc-800 hover:border-[#FF6B00]/50 transition-all duration-200 group">
                        <div className="flex items-center gap-2 mb-1">
                          <CoinIcon className="h-3.5 w-3.5 text-[#FF6B00] group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-zinc-400">Price</span>
                        </div>
                        <span className="text-sm font-bold text-white">
                          {formatNumber(enhancedMarketStats.price, true)}
                        </span>
                      </div>
                      <div className="bg-[#1A1A1A] rounded-lg p-3 border border-zinc-800 hover:border-[#FF6B00]/50 transition-all duration-200 group">
                        <div className="flex items-center gap-2 mb-1">
                          <Wallet className="h-3.5 w-3.5 text-[#FF6B00] group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-zinc-400">
                            Market Cap
                          </span>
                        </div>
                        <span className="text-sm font-bold text-white">
                          {formatNumber(enhancedMarketStats.marketCap)}
                        </span>
                      </div>
                      <div className="bg-[#1A1A1A] rounded-lg p-3 border border-zinc-800 hover:border-[#FF6B00]/50 transition-all duration-200 group">
                        <div className="flex items-center gap-2 mb-1">
                          <Users2 className="h-3.5 w-3.5 text-[#FF6B00] group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-zinc-400">Holders</span>
                        </div>
                        <span className="text-sm font-bold text-white">
                          {enhancedMarketStats.holderCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-[#1A1A1A] rounded-lg p-3 border border-zinc-800 hover:border-[#FF6B00]/50 transition-all duration-200 group">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-3.5 w-3.5 text-[#FF6B00] group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-zinc-400">
                            Proposals
                          </span>
                        </div>
                        <span className="text-sm font-bold text-white">
                          {totalProposals}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs - Bottom Border */}
            <div className="bg-[#1A1A1A] border-t border-zinc-800 px-6 py-3">
              <div className="flex flex-wrap gap-8">
                <Link href={`/daos/${encodedName}`}>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isProposals
                        ? "bg-[#FF6B00] text-white font-semibold shadow-lg shadow-[#FF6B00]/25"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">Proposals</span>
                  </div>
                </Link>
                <Link href={`/daos/${encodedName}/mission`}>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isMission
                        ? "bg-[#FF6B00] text-white font-semibold shadow-lg shadow-[#FF6B00]/25"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    <Info className="h-4 w-4" />
                    <span className="text-sm">Mission</span>
                  </div>
                </Link>
                <Link href={`/daos/${encodedName}/extensions`}>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isExtensions
                        ? "bg-[#FF6B00] text-white font-semibold shadow-lg shadow-[#FF6B00]/25"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    <Blocks className="h-4 w-4" />
                    <span className="text-sm">Extensions</span>
                  </div>
                </Link>
                <Link href={`/daos/${encodedName}/holders`}>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isHolders
                        ? "bg-[#FF6B00] text-white font-semibold shadow-lg shadow-[#FF6B00]/25"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Holders</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content Section */}
          {isProposals ? (
            /* Single Column Layout for Proposals Page */
            <div className="space-y-6">
              {/* Send On-chain Message - Above Proposals */}
              <div className="bg-[#2A2A2A] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-zinc-800 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Send Message
                </h3>
                <DAOSendProposal daoId={id!} />
              </div>

              {/* Proposals Content */}
              <div className="bg-[#2A2A2A] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-zinc-800 p-6">
                {children}
              </div>
            </div>
          ) : (
            /* Single Column Layout for Other Pages (Mission, Extensions, Holders) */
            <div className="bg-[#2A2A2A] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-zinc-800 p-6">
              {isMission ? (
                <div className="space-y-6">
                  <div>
                    {dao?.description ? (
                      <div className="prose prose-invert prose-zinc max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          className="text-zinc-300 leading-relaxed"
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xl font-bold text-white mb-3 mt-6 first:mt-0">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-lg font-semibold text-white mb-2 mt-4 first:mt-0">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="text-zinc-300 leading-relaxed mb-4 last:mb-0">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2 ml-4">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside text-zinc-300 mb-4 space-y-2 ml-4">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-zinc-300 leading-relaxed">
                                {children}
                              </li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-white">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-zinc-300">
                                {children}
                              </em>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                className="text-[#FF6B00] hover:underline font-medium"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-[#FF6B00] pl-4 italic text-zinc-400 my-4 bg-zinc-800/30 py-2 rounded-r">
                                {children}
                              </blockquote>
                            ),
                            code: ({ children }) => (
                              <code className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-sm font-mono">
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="bg-zinc-800 text-zinc-300 p-4 rounded-lg overflow-x-auto mb-4 border border-zinc-700">
                                {children}
                              </pre>
                            ),
                          }}
                        >
                          {dao.description.replace(/\\n/g, "\n")}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-zinc-400 italic">
                        No mission statement available for this DAO.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                children
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
