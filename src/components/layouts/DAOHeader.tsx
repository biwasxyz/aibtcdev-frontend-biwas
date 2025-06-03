"use client";

import type React from "react";
import Image from "next/image";
import { MetricsGrid } from "./MetricsGrid";
import { DAOBuyToken } from "@/components/daos/DaoBuyToken";

interface DAOInfo {
  id: string;
  name: string;
  image_url?: string;
}

interface TokenInfo {
  image_url?: string;
  max_supply?: number;
}

interface MarketStats {
  price: number;
  marketCap: number;
  holderCount: number;
}

interface DAOHeaderProps {
  dao: DAOInfo;
  token?: TokenInfo;
  marketStats: MarketStats;
  proposalCount: number;
  isLoading: boolean;
}

export function DAOHeader({ 
  dao, 
  token, 
  marketStats, 
  proposalCount, 
  isLoading 
}: DAOHeaderProps) {
  const metricsData = {
    price: marketStats.price,
    marketCap: marketStats.marketCap,
    holderCount: marketStats.holderCount,
    proposalCount,
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-3xl border border-border/50 shadow-sm overflow-hidden hover:border-border/80 transition-all duration-300">
      {/* Hero Content */}
      <div className="p-10">
        <div className="flex flex-col lg:flex-row items-start gap-10">
          {/* DAO Info - Left Side */}
          <div className="flex items-start gap-8 flex-1">
            {/* Enhanced Token Image */}
            {token?.image_url && (
              <div className="relative w-24 h-24 flex-shrink-0 rounded-3xl overflow-hidden border-2 border-border/30 shadow-md bg-gradient-to-br from-primary/10 to-secondary/10">
                <Image
                  src={token.image_url || "/placeholder.svg"}
                  alt={`${dao?.name} token`}
                  fill
                  className="object-cover"
                  sizes="96px"
                  priority
                />
              </div>
            )}
            
            {/* DAO Details */}
            <div className="flex-1 min-w-0 space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                  {dao?.name}
                </h1>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium">Active DAO</span>
                  </div>
                </div>
              </div>
              
              {/* Buy Token Button */}
              {dao.id && (
                <div className="flex">
                  <DAOBuyToken daoId={dao.id} />
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Metrics Grid - Right Side */}
          <div className="w-full lg:w-auto lg:min-w-[400px]">
            <MetricsGrid 
              data={metricsData} 
              isLoading={isLoading} 
            />
          </div>
        </div>
      </div>
    </div>
  );
} 