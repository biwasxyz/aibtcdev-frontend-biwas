import Link from "next/link";
import { Users, FileText, Info } from "lucide-react";

interface DAOInfo {
  id: string;
  name: string;
  description?: string;
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
  currentPath,
}: DAOHeaderProps) {
  // Define tabs with new structure: Proposals → Holders → About DAO
  const tabs = [
    {
      name: "Proposals",
      href: `/daos/${daoName}`,
      icon: FileText,
      isActive: currentPath === `/daos/${daoName}`,
      count: proposalCount,
    },
    {
      name: "Holders",
      href: `/daos/${daoName}/holders`,
      icon: Users,
      isActive: currentPath === `/daos/${daoName}/holders`,
      count: marketStats.holderCount,
    },
    {
      name: "About DAO",
      href: `/daos/${daoName}/about`,
      icon: Info,
      isActive: currentPath === `/daos/${daoName}/about`,
    },
  ];

  return (
    <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/30 p-4 sm:p-8">
      {/* DAO Info Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        {/* DAO Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            {token?.image_url ? (
              <img
                src={token.image_url}
                alt={dao.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-bold text-primary">
                  {dao.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* DAO Details */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {dao.name}
          </h1>

          {/* Market Stats */}
          <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Price</span>
              <span className="font-semibold text-foreground">
                ${marketStats.price.toFixed(4)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Market Cap</span>
              <span className="font-semibold text-foreground">
                ${(marketStats.marketCap / 1000000).toFixed(2)}M
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Holders</span>
              <span className="font-semibold text-foreground">
                {marketStats.holderCount.toLocaleString()}
              </span>
            </div>
            {token?.max_supply && (
              <div className="flex flex-col">
                <span className="text-muted-foreground">Max Supply</span>
                <span className="font-semibold text-foreground">
                  {(token.max_supply / 1000000).toFixed(0)}M
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-t border-border/30 pt-6">
        <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    tab.isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{tab.name}</span>
                {tab.count !== undefined && (
                  <span
                    className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${
                      tab.isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                  >
                    {tab.count.toLocaleString()}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
