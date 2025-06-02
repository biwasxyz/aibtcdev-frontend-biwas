"use client";

import { useRef, useState, useMemo } from "react";
import { Card, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProposalCard from "./ProposalCard";
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

  return (
    <div className="w-full min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Proposals
              </h2>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                View and filter proposals across all DAOs
              </p>
            </div>
            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Mobile Filter Overlay */}
          {isMobileFilterOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
              onClick={() => setIsMobileFilterOpen(false)}
            >
              <div
                className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#1A1A1A] border-l border-zinc-700 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Filters</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="p-4">
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
          <div className="hidden lg:block">
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
            {/* Proposals List */}
            <div ref={proposalsRef} className="space-y-3 sm:space-y-4">
              {paginatedProposals.length === 0 ? (
                <Card className="bg-[#2A2A2A] border-gray-600">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mx-auto mb-4" />
                    <CardDescription className="text-gray-400 text-base sm:text-lg">
                      No proposals found.
                    </CardDescription>
                    <p className="text-gray-500 text-sm mt-2">
                      Try adjusting your search terms or filters.
                    </p>
                  </CardContent>
                </Card>
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
              <div className="mt-6 sm:mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredAndSortedProposals.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



export default AllProposals;
