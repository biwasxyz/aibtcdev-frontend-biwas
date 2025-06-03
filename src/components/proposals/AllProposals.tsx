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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="space-y-12">
          {/* Hero Header Section */}
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6">
              <Vote className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                Governance Proposals
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Explore and participate in DAO governance decisions across all autonomous organizations
              </p>
            </div>

            {/* Quick Stats Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card/30 backdrop-blur-sm rounded-2xl p-6 border border-border/30"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    <div className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Toggle for Mobile */}
          <div className="lg:hidden flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">
              All Proposals
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="flex items-center gap-2 bg-card/50 border-border/50 text-foreground hover:bg-card hover:border-border transition-all duration-300"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Main Content Layout */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Mobile Filter Overlay */}
            {isMobileFilterOpen && (
              <div
                className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                <div
                  className="absolute right-0 top-0 h-full w-full max-w-sm bg-card/95 backdrop-blur-xl border-l border-border/50 overflow-y-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-border/30 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Filters</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all duration-300"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="p-6">
                    <FilterSidebar
                      title=""
                      filters={filterConfig}
                      filterState={filterState}
                      onFilterChange={handleFilterChange}
                      summaryStats={summaryStats}
                    />
                  </div>
                </div>
              </div>
            )}

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
              {/* Desktop Section Header */}
              <div className="hidden lg:block mb-8">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  All Proposals
                </h2>
                <p className="text-muted-foreground mt-2">
                  {filteredAndSortedProposals.length > 0 
                    ? `Showing ${filteredAndSortedProposals.length} ${filteredAndSortedProposals.length === 1 ? 'proposal' : 'proposals'}`
                    : 'No proposals match your current filters'
                  }
                </p>
              </div>

              {/* Proposals List */}
              <div ref={proposalsRef} className="space-y-6">
                {paginatedProposals.length === 0 ? (
                  <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50 py-24">
                    <div className="text-center space-y-6">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-muted/50">
                        <FileText className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-medium text-foreground">
                          No Proposals Found
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
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
                <div className="mt-12">
                  <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50 p-6">
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllProposals;
