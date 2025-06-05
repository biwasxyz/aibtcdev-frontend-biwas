"use client";

import type React from "react";
import Image from "next/image";
import { DAOBuyToken } from "@/components/daos/DaoBuyToken";
import { Activity, Info, Blocks, CoinsIcon as CoinIcon, TrendingUp, Users2, FileText } from "lucide-react";
import Link from "next/link";

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
  daoName: string;
  currentPath: string;
}

export function DAOHeader({ 
  dao, 
  token, 
  marketStats, 
    proposalCount,
  daoName,
  currentPath
}: DAOHeaderProps) {
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

  // Navigation items
  const navItems = [
    {
      href: `/daos/${daoName}`,
      label: "Proposals",
      icon: Activity,
      isActive: currentPath === `/daos/${daoName}`,
    },
    {
      href: `/daos/${daoName}/mission`,
      label: "Mission",
      icon: Info,
      isActive: currentPath === `/daos/${daoName}/mission`,
    },
    {
      href: `/daos/${daoName}/extensions`,
      label: "Extensions",
      icon: Blocks,
      isActive: currentPath === `/daos/${daoName}/extensions`,
    },
    {
      href: `/daos/${daoName}/holders`,
      label: "Holders",
      icon: Users2,
      isActive: currentPath === `/daos/${daoName}/holders`,
    },
  ];

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm overflow-hidden hover:border-border/80 transition-all duration-300">
      {/* Main Header Content */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          {/* DAO Info - Left Side */}
          <div className="flex items-center gap-4 flex-1">
            {/* Token Image */}
            {token?.image_url && (
              <div className="relative w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden border border-border/30 bg-gradient-to-br from-primary/10 to-secondary/10">
                <Image
                  src={token.image_url || "/placeholder.svg"}
                  alt={`${dao?.name} token`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  priority
                />
              </div>
            )}
            
            {/* DAO Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {dao?.name}
                </h1>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="font-medium">Active</span>
                </div>
              </div>
              
              {/* Buy Token Button */}
              {dao.id && (
                <DAOBuyToken daoId={dao.id} daoName={dao.name}/> 
              )}
            </div>
          </div>

            {/* Compact Metrics - Right Side */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <CoinIcon className="h-3 w-3" />
                Price
              </div>
              <div className="text-lg font-bold text-foreground">
                {formatNumber(marketStats.price, true)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3" />
                Market Cap
              </div>
              <div className="text-lg font-bold text-foreground">
                {formatNumber(marketStats.marketCap)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Users2 className="h-3 w-3" />
                Holders
              </div>
              <div className="text-lg font-bold text-foreground">
                {marketStats.holderCount.toLocaleString()}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <FileText className="h-3 w-3" />
                Proposals
              </div>
              <div className="text-lg font-bold text-foreground">
                {proposalCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integrated Navigation */}
      <div className="border-t border-border/50 bg-muted/20 px-4 sm:px-6 py-4">
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    item.isActive
                      ? "bg-primary text-primary-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
} 