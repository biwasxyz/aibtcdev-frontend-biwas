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
      <main className="min-h-[100dvh] w-full flex flex-col bg-background">
        <div className="flex-1 w-full">
          <div className="flex h-screen items-center justify-center bg-background">
            <Loader />
          </div>
        </div>
      </main>
    );
  }

  if (!dao) {
    return (
      <main className="min-h-[100dvh] w-full flex flex-col bg-background">
        <div className="flex-1 w-full">
          <div className="flex items-center justify-center min-h-[50vh] bg-background">
            <div className="text-center space-y-3">
              <p className="text-xl font-medium text-foreground">DAO not found</p>
              <p className="text-base text-muted-foreground">
                The DAO you&apos;re looking for doesn&apos;t exist or has been
                removed
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] w-full flex flex-col bg-background">
      <div className="flex-1 w-full">
        <div className="flex flex-col w-full bg-background min-h-screen">
          <div className="w-full py-8 flex-grow">
              {/* Main Content Grid */}
              <div className="px-6 max-w-7xl mx-auto">
                {/* DAO Header Section */}
                <div className="bg-card rounded-xl shadow-lg border border-border mb-8 overflow-hidden">
                  {/* Main Header Content */}
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row items-start gap-8">
                      {/* DAO Info - Left Side */}
                      <div className="flex items-start gap-6 flex-1">
                        {/* Token Image */}
                        {token?.image_url && (
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border border-border shadow-sm">
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
                          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-3 truncate">
                            {dao?.name}
                          </h1>
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-3">
                              <span className="text-xs px-3 py-1.5 bg-primary/20 text-primary rounded-full border border-primary/30">
                                Active DAO
                              </span>
                              <span className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full border border-border">
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
                          <div className="grid grid-cols-2 gap-3">
                            {[...Array(4)].map((_, i) => (
                              <Skeleton
                                key={i}
                                className="h-16 w-full rounded-xl bg-muted"
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-background rounded-xl p-4 border border-border hover:border-primary/50 transition-all duration-150 group shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <CoinIcon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-150" />
                                <span className="text-xs text-muted-foreground">Price</span>
                              </div>
                              <span className="text-sm font-bold text-foreground">
                                {formatNumber(enhancedMarketStats.price, true)}
                              </span>
                            </div>
                            <div className="bg-background rounded-xl p-4 border border-border hover:border-primary/50 transition-all duration-150 group shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <Wallet className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-150" />
                                <span className="text-xs text-muted-foreground">
                                  Market Cap
                                </span>
                              </div>
                              <span className="text-sm font-bold text-foreground">
                                {formatNumber(enhancedMarketStats.marketCap)}
                              </span>
                            </div>
                            <div className="bg-background rounded-xl p-4 border border-border hover:border-primary/50 transition-all duration-150 group shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <Users2 className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-150" />
                                <span className="text-xs text-muted-foreground">Holders</span>
                              </div>
                              <span className="text-sm font-bold text-foreground">
                                {enhancedMarketStats.holderCount.toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-background rounded-xl p-4 border border-border hover:border-primary/50 transition-all duration-150 group shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-150" />
                                <span className="text-xs text-muted-foreground">
                                  Proposals
                                </span>
                              </div>
                              <span className="text-sm font-bold text-foreground">
                                {totalProposals}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Tabs - Bottom Border */}
                  <div className="bg-background border-t border-border px-8 py-4">
                    <div className="flex flex-wrap gap-6">
                      <Link href={`/daos/${encodedName}`}>
                        <div
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-150 ${
                            isProposals
                              ? "bg-primary text-primary-foreground font-semibold shadow-md"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Activity className="h-4 w-4" />
                          <span className="text-sm">Proposals</span>
                        </div>
                      </Link>
                      <Link href={`/daos/${encodedName}/mission`}>
                        <div
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-150 ${
                            isMission
                              ? "bg-primary text-primary-foreground font-semibold shadow-md"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Info className="h-4 w-4" />
                          <span className="text-sm">Mission</span>
                        </div>
                      </Link>
                      <Link href={`/daos/${encodedName}/extensions`}>
                        <div
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-150 ${
                            isExtensions
                              ? "bg-primary text-primary-foreground font-semibold shadow-md"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Blocks className="h-4 w-4" />
                          <span className="text-sm">Extensions</span>
                        </div>
                      </Link>
                      <Link href={`/daos/${encodedName}/holders`}>
                        <div
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-150 ${
                            isHolders
                              ? "bg-primary text-primary-foreground font-semibold shadow-md"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                  <div className="space-y-8">
                    {/* Send On-chain Message - Above Proposals */}
                    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Send Message
                      </h3>
                      <DAOSendProposal daoId={id!} />
                    </div>

                    {/* Proposals Content */}
                    <div className="bg-card rounded-xl shadow-sm border border-border p-8">
                      {children}
                    </div>
                  </div>
                ) : (
                  /* Single Column Layout for Other Pages (Mission, Extensions, Holders) */
                  <div className="bg-card rounded-xl shadow-sm border border-border p-8">
                    {isMission ? (
                      <div className="space-y-8">
                        <div>
                          {dao?.description ? (
                            <div className="prose prose-invert prose-zinc max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                className="text-muted-foreground leading-relaxed"
                                components={{
                                  h1: ({ children }) => (
                                    <h1 className="text-2xl font-bold text-foreground mb-4 mt-6 first:mt-0">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-xl font-bold text-foreground mb-3 mt-6 first:mt-0">
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-lg font-semibold text-foreground mb-2 mt-4 first:mt-0">
                                      {children}
                                    </h3>
                                  ),
                                  p: ({ children }) => (
                                    <p className="text-muted-foreground leading-relaxed mb-4 last:mb-0">
                                      {children}
                                    </p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2 ml-4">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-2 ml-4">
                                      {children}
                                    </ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="text-muted-foreground leading-relaxed">
                                      {children}
                                    </li>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-semibold text-foreground">
                                      {children}
                                    </strong>
                                  ),
                                  em: ({ children }) => (
                                    <em className="italic text-muted-foreground">
                                      {children}
                                    </em>
                                  ),
                                  a: ({ href, children }) => (
                                    <a
                                      href={href}
                                      className="text-primary hover:underline font-medium transition-colors duration-150"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {children}
                                    </a>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4 bg-muted/30 py-2 rounded-r">
                                      {children}
                                    </blockquote>
                                  ),
                                  code: ({ children }) => (
                                    <code className="bg-muted text-muted-foreground px-2 py-1 rounded text-sm font-mono">
                                      {children}
                                    </code>
                                  ),
                                  pre: ({ children }) => (
                                    <pre className="bg-muted text-muted-foreground p-4 rounded-lg overflow-x-auto mb-4 border border-border">
                                      {children}
                                    </pre>
                                  ),
                                }}
                              >
                                {dao.description.replace(/\\n/g, "\n")}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="text-muted-foreground italic">
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
        </div>
    </main>
  );
}
