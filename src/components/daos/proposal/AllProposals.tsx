"use client";

import { useRef, useState, useMemo } from "react";
import { Card, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VoteProgress from "./VoteProgress";
import ProposalDetails from "./ProposalDetails";
import { useVotingStatus } from "./TimeStatus";
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
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Building2,
  Filter,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { truncateString, getExplorerLink } from "@/helpers/helper";
import Link from "next/link";

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
  const proposalsRef = useRef<HTMLDivElement>(null);
  const [hiddenProposals, setHiddenProposals] = useState<Set<string>>(
    new Set()
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
      new Set(proposals.map((p) => p.daos?.name).filter(Boolean))
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
        if (!proposal.creator.toLowerCase().includes(creatorTerm)) return false;
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
          return a.title.localeCompare(b.title);
        case "votes":
          const votesA =
            Number(a.votes_for || 0) + Number(a.votes_against || 0);
          const votesB =
            Number(b.votes_for || 0) + Number(b.votes_against || 0);
          return votesB - votesA;
        case "status":
          return a.status.localeCompare(b.status);
        case "dao":
          const daoA = a.daos?.name || "";
          const daoB = b.daos?.name || "";
          return daoA.localeCompare(daoB);
        case "creator":
          return a.creator.localeCompare(b.creator);
        default:
          return 0;
      }
    });

    return filtered;
  }, [proposals, hiddenProposals, filterState]);

  // Pagination logic
  const totalPages = Math.ceil(
    filteredAndSortedProposals.length / itemsPerPage
  );
  const paginatedProposals = filteredAndSortedProposals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate statistics
  const totalProposals = filteredAndSortedProposals.length;
  const activeProposals = filteredAndSortedProposals.filter(
    (p) => p.status === "DEPLOYED"
  ).length;
  const passedProposals = filteredAndSortedProposals.filter(
    (p) => p.passed === true
  ).length;
  const failedProposals = filteredAndSortedProposals.filter(
    (p) => p.status === "FAILED"
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
    <div className="w-full min-h-screen bg-[#1A1A1A]">
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
                  <EnhancedAllProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onToggleVisibility={toggleProposalVisibility}
                    isHidden={hiddenProposals.has(proposal.id)}
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

// Enhanced Proposal Card Component for the all proposals view
interface EnhancedAllProposalCardProps {
  proposal: ProposalWithDAO;
  onToggleVisibility: (proposalId: string) => void;
  isHidden: boolean;
}

const EnhancedAllProposalCard = ({
  proposal,
  onToggleVisibility,
  isHidden,
}: EnhancedAllProposalCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get voting status
  const { isActive, isEnded } = useVotingStatus(
    proposal.status,
    proposal.vote_start,
    proposal.vote_end
  );

  // Get status badge
  const getStatusBadge = () => {
    if (isActive) {
      return (
        <Badge className="bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 border-orange-500/50">
          Active
        </Badge>
      );
    } else if (isEnded && proposal.passed) {
      return (
        <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50">
          Passed
        </Badge>
      );
    } else if (isEnded && !proposal.passed) {
      return (
        <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50">
          Failed
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500/20 text-gray-500 hover:bg-gray-500/30 border-gray-500/50">
          Pending
        </Badge>
      );
    }
  };

  // Get vote count summary
  const getVoteSummary = () => {
    const votesFor = Number(proposal.votes_for || 0);
    const votesAgainst = Number(proposal.votes_against || 0);
    const totalVotes = votesFor + votesAgainst;
    if (totalVotes === 0) {
      return "0 Total Votes";
    }
    return `${totalVotes} Total Vote${totalVotes !== 1 ? "s" : ""}`;
  };

  // Get DAO name with link
  const getDAOInfo = () => {
    if (proposal.daos?.name) {
      const encodedDAOName = encodeURIComponent(proposal.daos.name);
      return (
        <Link
          href={`/daos/${encodedDAOName}`}
          className="hover:text-white transition-colors"
        >
          {proposal.daos.name}
        </Link>
      );
    }
    return "Unknown DAO";
  };

  return (
    <Card className="overflow-hidden bg-zinc-900/50 border-zinc-700/50 hover:border-zinc-600/50 transition-colors">
      <CardContent className="p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          {/* Left side - Title and metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              {/* Avatar placeholder */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-700 flex-shrink-0" />

              {/* Title and basic info */}
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 truncate">
                  {proposal.title}
                </h3>
                {/* Mobile-optimized metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {getDAOInfo()}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      By{" "}
                      <a
                        href={getExplorerLink("address", proposal.creator)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white transition-colors"
                      >
                        {truncateString(proposal.creator, 4, 4)}
                      </a>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(proposal.created_at), "MMM d, yyyy")}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>{getVoteSummary()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleVisibility(proposal.id)}
              className="h-8 w-8 text-gray-400 hover:text-white"
              title={isHidden ? "Show proposal" : "Hide proposal"}
            >
              {isHidden ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Category badge if available */}
        {proposal.type && (
          <div className="mb-4">
            <Badge
              variant="outline"
              className="text-purple-400 border-purple-400/50"
            >
              {proposal.type}
            </Badge>
          </div>
        )}

        {/* Vote Progress - Always visible */}
        <div className="mb-4">
          <VoteProgress
            contractAddress={proposal.contract_principal}
            proposalId={proposal.proposal_id}
            votesFor={proposal.votes_for}
            votesAgainst={proposal.votes_against}
            refreshing={false}
            tokenSymbol={proposal.token_symbol || ""}
            liquidTokens={
              proposal.liquid_tokens !== null
                ? proposal.liquid_tokens.toString()
                : "0"
            }
            isActive={isActive}
          />
        </div>

        {/* Expand/Collapse Toggle */}
        <div className="flex justify-between items-center">
          <CardDescription className="text-gray-400 text-xs sm:text-sm">
            {proposal.status || "Awaiting first vote"}
          </CardDescription>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="self-start text-gray-400 hover:text-white p-2 h-auto text-xs sm:text-sm"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Hide Details</span>
                <span className="sm:hidden">Hide</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">View Details</span>
                <span className="sm:hidden">Details</span>
              </>
            )}
          </Button>
        </div>

        {/* Expanded Details - Using the reusable component */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-600">
            <ProposalDetails proposal={proposal} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AllProposals;
