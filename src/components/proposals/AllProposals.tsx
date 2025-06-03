"use client";

import { useRef, useState, useMemo } from "react";
// Removed unused Card imports
import { Button } from "@/components/ui/button";
import ProposalCard from "@/components/proposals/ProposalCard";
import {
  FilterSidebar,
  type FilterConfig,
  type FilterState,
  type SummaryStats,
} from "@/components/reusables/FilterSidebar";
import { Pagination } from "@/components/reusables/Pagination";
import type { ProposalWithDAO } from "@/types/supabase";
import {
  FileText,
  Filter,
  X,
  Vote,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { useTokens } from "@/hooks/useTokens";

interface AllProposalsProps {
  proposals: ProposalWithDAO[];
}

// Define sort options
type SortField =
  | "newest"
  | "oldest"
  | "title"
  | "votes"
  | "status"
  | "creator"
  | "dao";

const AllProposals = ({ proposals }: AllProposalsProps) => {
  // Fetch tokens and create lookup map
  const { tokenLookup } = useTokens();
  const proposalsRef = useRef<HTMLDivElement>(null);
  const [hiddenProposals, setHiddenProposals] = useState<Set<string>>(
    new Set(),
  );
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter and pagination state
  const [filterState, setFilterState] = useState<FilterState>({
    search: "",
    dao: "all",
    status: "all",
    creator: "",
    sort: "newest",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Get unique DAOs for filter options
  const daoOptions = useMemo(() => {
    const uniqueDAOs = Array.from(
      new Set(proposals.map((p) => p.daos?.name).filter(Boolean)),
    ).sort();

    return [
      { value: "all", label: "All DAOs" },
      ...uniqueDAOs.map((dao) => ({ value: dao!, label: dao! })),
    ];
  }, [proposals]);

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: "search",
      label: "Search",
      type: "search",
      placeholder: "Search proposals...",
    },
    {
      key: "dao",
      label: "DAO",
      type: "select",
      options: daoOptions,
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "all", label: "All Status" },
        { value: "DEPLOYED", label: "Active", badge: true },
        { value: "PASSED", label: "Passed", badge: true },
        { value: "FAILED", label: "Failed", badge: true },
        { value: "DRAFT", label: "Draft", badge: true },
      ],
    },
    {
      key: "creator",
      label: "Creator Address",
      type: "search",
      placeholder: "Enter creator address...",
    },
    {
      key: "sort",
      label: "Sort By",
      type: "select",
      options: [
        { value: "newest", label: "Newest First" },
        { value: "oldest", label: "Oldest First" },
        { value: "title", label: "Title A-Z" },
        { value: "votes", label: "Most Votes" },
        { value: "status", label: "Status" },
        { value: "dao", label: "DAO Name" },
      ],
    },
  ];

  // Filter and sort logic
  const filteredAndSortedProposals = useMemo(() => {
    const filtered = proposals.filter((proposal) => {
      // Hide hidden proposals
      if (hiddenProposals.has(proposal.id)) return false;

      // Search filter
      if (filterState.search && typeof filterState.search === "string") {
        const searchTerm = filterState.search.toLowerCase();
        const matchesTitle =
          proposal.title?.toLowerCase().includes(searchTerm) || false;
        const matchesDAO =
          proposal.daos?.name?.toLowerCase().includes(searchTerm) || false;
        const matchesCreator =
          proposal.creator?.toLowerCase().includes(searchTerm) || false;
        if (!matchesTitle && !matchesDAO && !matchesCreator) return false;
      }

      // DAO filter
      if (filterState.dao && filterState.dao !== "all") {
        if (proposal.daos?.name !== filterState.dao) return false;
      }

      // Status filter
      if (filterState.status && filterState.status !== "all") {
        if (filterState.status === "PASSED" && !proposal.passed) return false;
        if (filterState.status === "DEPLOYED" && proposal.status !== "DEPLOYED")
          return false;
        if (filterState.status === "FAILED" && proposal.status !== "FAILED")
          return false;
        if (filterState.status === "DRAFT" && proposal.status !== "DRAFT")
          return false;
      }

      // Creator filter
      if (filterState.creator && typeof filterState.creator === "string") {
        const creatorTerm = filterState.creator.toLowerCase();
        if (!proposal.creator?.toLowerCase().includes(creatorTerm)) return false;
      }

      return true;
    });

    // Sort logic
    const sortField = filterState.sort as SortField;
    filtered.sort((a, b) => {
      switch (sortField) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "votes":
          const votesA =
            Number(a.votes_for || 0) + Number(a.votes_against || 0);
          const votesB =
            Number(b.votes_for || 0) + Number(b.votes_against || 0);
          return votesB - votesA;
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        case "dao":
          const daoA = a.daos?.name || "";
          const daoB = b.daos?.name || "";
          return daoA.localeCompare(daoB);
        case "creator":
          return (a.creator || "").localeCompare(b.creator || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [proposals, hiddenProposals, filterState]);

  // Pagination logic
  const totalPages = Math.ceil(
    filteredAndSortedProposals.length / itemsPerPage,
  );
  const paginatedProposals = filteredAndSortedProposals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Calculate statistics
  const totalProposals = filteredAndSortedProposals.length;
  const activeProposals = filteredAndSortedProposals.filter(
    (p) => p.status === "DEPLOYED",
  ).length;
  const passedProposals = filteredAndSortedProposals.filter(
    (p) => p.passed === true,
  ).length;
  const failedProposals = filteredAndSortedProposals.filter(
    (p) => p.status === "FAILED",
  ).length;

  // Summary stats for sidebar
  const summaryStats: SummaryStats = {
    total: {
      label: "Total Proposals",
      value: totalProposals,
    },
    active: {
      label: "Active",
      value: activeProposals,
    },
    passed: {
      label: "Passed",
      value: passedProposals,
    },
    failed: {
      label: "Failed",
      value: failedProposals,
    },
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
    // Close mobile filter on filter change (optional UX improvement)
    if (window.innerWidth < 1024) {
      setIsMobileFilterOpen(false);
    }
  };

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    proposalsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Toggle proposal visibility
  const toggleProposalVisibility = (proposalId: string) => {
    setHiddenProposals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(proposalId)) {
        newSet.delete(proposalId);
      } else {
        newSet.add(proposalId);
      }
      return newSet;
    });
  };

  // Calculate summary metrics for hero section
  const heroStats = [
    {
      icon: Activity,
      label: "Total",
      value: totalProposals,
      color: "text-primary",
    },
    {
      icon: TrendingUp,
      label: "Active",
      value: activeProposals,
      color: "text-blue-500",
    },
    {
      icon: CheckCircle,
      label: "Passed",
      value: passedProposals,
      color: "text-emerald-500",
    },
    {
      icon: XCircle,
      label: "Failed",
      value: failedProposals,
      color: "text-rose-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-x-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-4 md:top-20 md:left-20 w-32 h-32 md:w-64 md:h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-4 md:bottom-40 md:right-20 w-24 h-24 md:w-48 md:h-48 bg-secondary/5 rounded-full blur-3xl delay-1000" />
        <div className="absolute top-32 right-8 md:top-60 md:right-40 w-16 h-16 md:w-32 md:h-32 bg-primary/3 rounded-full blur-2xl delay-500" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-6 sm:py-8 md:py-16">
        <div className="space-y-6 sm:space-y-8 md:space-y-16">
          {/* Enhanced Hero Header Section */}
          <div className="text-center space-y-4 sm:space-y-6 md:space-y-10">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-xl sm:rounded-2xl md:rounded-[2rem] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 backdrop-blur-sm mb-4 sm:mb-6 md:mb-8 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-500 ease-out group">
              <Vote className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
              <Sparkles className="absolute -top-1 -right-1 md:-top-2 md:-right-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-secondary" />
            </div>
            
            <div className="space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto px-2 sm:px-4">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
                Governance Proposals
                <span className="block text-base sm:text-lg md:text-2xl font-medium text-primary mt-1 md:mt-2 tracking-wide">
                  Decision Hub
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                Explore and participate in DAO governance decisions across all 
                <span className="text-primary font-medium"> autonomous organizations</span>
              </p>
            </div>
          </div>

          {/* Enhanced Metrics Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-8 px-1 sm:px-4">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-8 border border-border/30 shadow-xl hover:shadow-2xl hover:border-border/60 transition-all duration-500 ease-out group overflow-hidden relative"
              >
                {/* Card Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex flex-col items-center space-y-1 sm:space-y-2 md:space-y-4">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br ${stat.color === 'text-primary' ? 'from-primary/20 to-primary/10' : stat.color === 'text-blue-500' ? 'from-blue-500/20 to-blue-500/10' : stat.color === 'text-emerald-500' ? 'from-emerald-500/20 to-emerald-500/10' : 'from-rose-500/20 to-rose-500/10'} border border-primary/20 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    <stat.icon className={`h-4 w-4 sm:h-6 sm:w-6 md:h-8 md:w-8 ${stat.color}`} />
                  </div>
                  <div className="text-center space-y-0.5 sm:space-y-1 md:space-y-2">
                    <div className="text-lg sm:text-xl md:text-3xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-xs md:text-sm font-semibold text-muted-foreground tracking-wide">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Toggle for Mobile */}
          <div className="lg:hidden flex justify-between items-center px-3 sm:px-4">
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground truncate">
                All Proposals
              </h2>
              <p className="text-xs text-muted-foreground">
                {filteredAndSortedProposals.length > 0 
                  ? `${filteredAndSortedProposals.length} ${filteredAndSortedProposals.length === 1 ? 'proposal' : 'proposals'}`
                  : 'No proposals found'
                }
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="flex items-center gap-2 bg-card/50 border-border/50 text-foreground hover:bg-card hover:border-border transition-all duration-300 flex-shrink-0 ml-3"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden min-[420px]:inline">Filters</span>
            </Button>
          </div>

          {/* Mobile Filter Overlay */}
          {isMobileFilterOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsMobileFilterOpen(false)}
            >
              <div
                className="absolute right-0 top-0 h-full w-[85vw] max-w-[320px] bg-card/95 backdrop-blur-xl border-l border-border/50 overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 sm:p-4 md:p-6 border-b border-border/30 flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">Filters</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all duration-300 flex-shrink-0"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
                <div className="p-3 sm:p-4 md:p-6">
                  <FilterSidebar
                    title=""
                    filters={filterConfig}
                    filterState={filterState}
                    onFilterChange={handleFilterChange}
                    summaryStats={summaryStats}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main Content Layout */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8 px-3 sm:px-4 lg:px-0">
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block lg:w-80 flex-shrink-0">
              <FilterSidebar
                title="Filters"
                filters={filterConfig}
                filterState={filterState}
                onFilterChange={handleFilterChange}
                summaryStats={summaryStats}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Content Section Header */}
              <div className="space-y-1 sm:space-y-2 md:space-y-3 mb-4 sm:mb-6 md:mb-8">
                <div className="text-center lg:text-left">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight">
                    All Proposals
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-1 md:mt-2">
                    {filteredAndSortedProposals.length > 0 
                      ? `${filteredAndSortedProposals.length > 0 ? 'Showing ' : ''}${filteredAndSortedProposals.length} ${filteredAndSortedProposals.length === 1 ? 'proposal' : 'proposals'}`
                      : 'No proposals match your current filters'
                    }
                  </p>
                </div>
              </div>

              {/* Proposals List */}
              <div ref={proposalsRef} className="space-y-3 sm:space-y-4 md:space-y-6">
                {paginatedProposals.length === 0 ? (
                  <div className="bg-card/30 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl border border-border/50 py-12 sm:py-16 md:py-24">
                    <div className="text-center space-y-3 sm:space-y-4 md:space-y-6 px-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-xl sm:rounded-2xl md:rounded-3xl bg-muted/50">
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 text-muted-foreground/50" />
                      </div>
                      <div className="space-y-1 sm:space-y-2 md:space-y-3">
                        <h3 className="text-base sm:text-lg md:text-xl font-medium text-foreground">
                          No Proposals Found
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                          {totalProposals === 0 
                            ? "No proposals have been created yet. Check back later for new governance proposals."
                            : "No proposals match your current search and filter criteria. Try adjusting your filters or search terms."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  paginatedProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      onToggleVisibility={toggleProposalVisibility}
                      isHidden={hiddenProposals.has(proposal.id)}
                      tokenSymbol={tokenLookup[proposal.dao_id || ""] || ""}
                      showDAOInfo={true}
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
              {filteredAndSortedProposals.length > 0 && (
                <div className="mt-6 sm:mt-8 md:mt-12">
                  <div className="bg-card/30 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl border border-border/50 p-3 sm:p-4 md:p-6 overflow-x-auto">
                    <div className="min-w-[320px]">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredAndSortedProposals.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllProposals;
