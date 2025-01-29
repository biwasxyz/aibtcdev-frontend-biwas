"use client";

import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase/client";
import { Loader2, Search } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import type { Token } from "@/types/supabase";
import { useState } from "react";
import { fetchTokenPrice } from "@/queries/daoQueries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { ArrowDown, ArrowUp } from "lucide-react";
import { BsTwitterX } from "react-icons/bs";
import Link from "next/link";

// Types
interface DAO {
  id: string;
  name: string;
  mission: string;
  description: string;
  image_url: string;
  is_graduated: boolean;
  is_deployed: boolean;
  created_at: string;
  author_id: string;
  user_id?: string;
  extensions?: Array<{
    id: string;
    type: string;
    contract_principal?: string;
  }>;
}

type SortField = "price" | "price24hChanges" | "marketCap" | "created_at";

interface DAOCardProps {
  dao: DAO;
  token?: Token;
  tokenPrice?: {
    price: number;
    marketCap: number;
    holders: number;
    price24hChanges: number | null;
  };
  isFetchingPrice?: boolean;
}

// Utility Functions
const formatNumber = (num: number) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

const fetchDAOs = async (): Promise<DAO[]> => {
  const { data: daosData, error: daosError } = await supabase
    .from("daos")
    .select("*")
    .order("created_at", { ascending: false })
    .eq("is_broadcasted", true);

  if (daosError) throw daosError;
  if (!daosData) return [];

  // Fetch X user data including user_id
  const { data: xUsersData, error: xUsersError } = await supabase
    .from("x_users")
    .select("id, user_id");

  if (xUsersError) throw xUsersError;

  const { data: extensionsData, error: extensionsError } = await supabase
    .from("extensions")
    .select("*");

  if (extensionsError) throw extensionsError;

  return daosData.map((dao) => {
    const xUser = xUsersData?.find((user) => user.id === dao.author_id);
    return {
      ...dao,
      user_id: xUser?.user_id,
      extensions: extensionsData?.filter((cap) => cap.dao_id === dao.id) || [],
    };
  });
};

const fetchTokens = async (): Promise<Token[]> => {
  const { data: tokensData, error: tokensError } = await supabase
    .from("tokens")
    .select("*");
  if (tokensError) throw tokensError;
  return tokensData || [];
};

const fetchTokenPrices = async (
  daos: DAO[],
  tokens: Token[]
): Promise<
  Record<
    string,
    {
      price: number;
      marketCap: number;
      holders: number;
      price24hChanges: number | null;
    }
  >
> => {
  const prices: Record<
    string,
    {
      price: number;
      marketCap: number;
      holders: number;
      price24hChanges: number | null;
    }
  > = {};

  for (const dao of daos) {
    const extension = dao.extensions?.find((ext) => ext.type === "dex");
    const token = tokens?.find((t) => t.dao_id === dao.id);
    if (extension && token) {
      try {
        const priceUsd = await fetchTokenPrice(extension.contract_principal!);
        prices[dao.id] = priceUsd;
      } catch (error) {
        console.error(`Error fetching price for DAO ${dao.id}:`, error);
        prices[dao.id] = {
          price: 0,
          marketCap: 0,
          holders: 0,
          price24hChanges: null,
        };
      }
    }
  }
  return prices;
};

// DAO Card Component
const DAOCard = ({ dao, token, tokenPrice, isFetchingPrice }: DAOCardProps) => {
  return (
    <div className="group h-full">
      <Card className="transition-all duration-200 hover:shadow-lg">
        <CardHeader className="space-y-2">
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-lg">
              <Image
                src={
                  token?.image_url ||
                  dao.image_url ||
                  "/placeholder.svg?height=64&width=64"
                }
                alt={dao.name}
                width={64}
                height={64}
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                placeholder="blur"
                blurDataURL="/placeholder.svg?height=64&width=64"
              />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link href={`/daos/${dao.id}`}>
                    <h3 className="text-lg font-semibold leading-none tracking-tight group-hover:text-primary">
                      {dao.name}
                    </h3>
                  </Link>
                  {dao.is_graduated && (
                    <Badge variant="secondary" className="h-5">
                      Graduated
                    </Badge>
                  )}
                </div>
              </div>
              {token?.symbol && (
                <p className="text-sm font-medium text-muted-foreground">
                  ${token.symbol}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <Link href={`/daos/${dao.id}`}>
          <CardContent className="space-y-4">
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {dao.mission}
            </p>

            <Separator className="my-2" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-muted-foreground">Token Price</p>
                {isFetchingPrice ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <p className="font-medium">
                    ${tokenPrice?.price?.toFixed(8) || "0.00"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground">24h Change</p>
                {isFetchingPrice ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <div className="flex items-center gap-1 font-medium">
                    {tokenPrice?.price24hChanges != null ? (
                      <>
                        {tokenPrice.price24hChanges > 0 ? (
                          <ArrowUp className="h-4 w-4 text-green-500" />
                        ) : tokenPrice.price24hChanges < 0 ? (
                          <ArrowDown className="h-4 w-4 text-red-500" />
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
              </div>
            </div>
          </CardContent>

          <CardFooter className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-muted-foreground">Market Cap</p>
              {isFetchingPrice ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <p className="font-medium">
                  ${formatNumber(tokenPrice?.marketCap || 0)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground">Holders</p>
              {isFetchingPrice ? (
                <Skeleton className="h-5 w-20" />
              ) : (
                <p className="font-medium">{tokenPrice?.holders || 0}</p>
              )}
            </div>
          </CardFooter>
        </Link>

        {/* Prompted by Section */}
        {dao.user_id && (
          <CardFooter className="mt-2 flex items-center gap-2 border-t pt-3 text-sm text-muted-foreground">
            <span>Prompted by:</span>
            <Link
              href={`https://x.com/i/user/${dao.user_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              View on
              <span>
                <BsTwitterX className="h-4 w-4" />{" "}
              </span>
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

// Main Component
export default function DAOs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");

  const { data: daos, isLoading: isLoadingDAOs } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
    staleTime: 1000000,
  });

  const { data: tokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: fetchTokens,
    staleTime: 100000,
  });

  const { data: tokenPrices, isFetching: isFetchingTokenPrices } = useQuery({
    queryKey: ["tokenPrices", daos, tokens],
    queryFn: () => fetchTokenPrices(daos || [], tokens || []),
    enabled: !!daos && !!tokens,
    staleTime: 1000000,
  });

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
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Heading className="text-3xl font-bold sm:text-4xl">DAOs</Heading>
          <p className="text-lg text-muted-foreground">
            Explore and discover decentralized autonomous organizations
          </p>
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-start">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Sort by:</p>
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

        {!isLoadingDAOs && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedDAOs.length} DAOs
          </p>
        )}
      </div>

      {isLoadingDAOs ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedDAOs.map((dao) => {
            const token = tokens?.find((token) => token.dao_id === dao.id);
            const tokenPrice = tokenPrices?.[dao.id];

            return (
              <DAOCard
                key={dao.id}
                dao={dao}
                token={token}
                tokenPrice={tokenPrice}
                isFetchingPrice={isFetchingTokenPrices}
              />
            );
          })}
        </div>
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
