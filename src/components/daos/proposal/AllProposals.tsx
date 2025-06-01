"use client";

import { useRef, useState, useMemo } from "react";
import { Card, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessageDisplay from "./MessageDisplay";
import VoteProgress from "./VoteProgress";
import TimeStatus, { useVotingStatus } from "./TimeStatus";
import BlockVisual from "./BlockVisual";
import VotesTable from "./VotesTable";
import ProposalMetrics from "./ProposalMetrics";
import LabeledField from "./LabeledField";
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
  Vote,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  BarChart3,
  Blocks,
  Layers,
  ArrowRight,
  Timer,
  Wallet,
  Activity,
  Hash,
  RefreshCw,
  Info,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import {
  truncateString,
  getExplorerLink,
  formatAction,
} from "@/helpers/helper";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
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

  // Get unique creators for suggestions (you might want to implement autocomplete)
  const creatorOptions = useMemo(() => {
    const uniqueCreators = Array.from(
      new Set(proposals.map((p) => p.creator).filter(Boolean))
    );
    return uniqueCreators.slice(0, 10); // Limit for performance
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
    let filtered = proposals.filter((proposal) => {
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

  // Get status badge for individual proposals
  const getStatusBadge = (proposal: ProposalWithDAO) => {
    if (proposal.status === "DEPLOYED") {
      return (
        <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-xs px-2 py-0.5">
          Active
        </Badge>
      );
    }
    if (proposal.passed === true) {
      return (
        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs px-2 py-0.5">
          Passed
        </Badge>
      );
    }
    if (proposal.status === "FAILED") {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs px-2 py-0.5">
          Failed
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs px-2 py-0.5">
        Draft
      </Badge>
    );
  };

  // Get vote count summary
  const getVoteSummary = (proposal: ProposalWithDAO) => {
    const votesFor = Number(proposal.votes_for || 0);
    const votesAgainst = Number(proposal.votes_against || 0);
    const totalVotes = votesFor + votesAgainst;
    if (totalVotes === 0) {
      return "0 Votes • Awaiting first vote";
    }
    return `${totalVotes} Vote${
      totalVotes === 1 ? "" : "s"
    } • ${votesFor} For • ${votesAgainst} Against`;
  };

  return (
    <div className="w-full min-h-screen bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <FilterSidebar
            title="Filters"
            filters={filterConfig}
            filterState={filterState}
            onFilterChange={handleFilterChange}
            summaryStats={summaryStats}
          />

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Proposals</h2>
                  <p className="text-gray-400 mt-1">
                    View and filter proposals across all DAOs
                  </p>
                </div>
                <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-sm px-3 py-1">
                  Cross-DAO View
                </Badge>
              </div>
            </div>

            {/* Proposals List */}
            <div ref={proposalsRef} className="space-y-4">
              {paginatedProposals.length === 0 ? (
                <Card className="bg-[#2A2A2A] border-gray-600">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <CardDescription className="text-gray-400 text-lg">
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
              <div className="mt-8">
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
  const [refreshing, setRefreshing] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(60);
  const queryClient = useQueryClient();

  // Get voting status
  const { isActive, isEnded } = useVotingStatus(
    proposal.status,
    proposal.vote_start,
    proposal.vote_end
  );

  // Determine execution status
  const isExecuted = proposal.executed === true;
  const isPending = proposal.passed && proposal.executed !== true;
  const isFailed = isEnded && !proposal.passed;

  // Refresh votes data
  const refreshVotesData = useCallback(async () => {
    setRefreshing(true);

    try {
      await queryClient.invalidateQueries({
        queryKey: [
          "proposalVotes",
          proposal.contract_principal,
          proposal.proposal_id,
        ],
        refetchType: "all",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setRefreshing(false);
      setNextRefreshIn(60);
    }
  }, [queryClient, proposal.contract_principal, proposal.proposal_id]);

  // Implement countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !refreshing) {
      interval = setInterval(() => {
        setNextRefreshIn((prev) => {
          if (prev <= 1) {
            // When countdown reaches 0, trigger refresh
            refreshVotesData();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, refreshing, refreshVotesData]);

  // Get status badge
  const getStatusBadge = () => {
    if (proposal.status === "DEPLOYED") {
      return (
        <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-xs px-2 py-0.5">
          Active
        </Badge>
      );
    }
    if (proposal.passed === true) {
      return (
        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs px-2 py-0.5">
          Passed
        </Badge>
      );
    }
    if (proposal.status === "FAILED") {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs px-2 py-0.5">
          Failed
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs px-2 py-0.5">
        Draft
      </Badge>
    );
  };

  // Get vote count summary
  const getVoteSummary = () => {
    const votesFor = Number(proposal.votes_for || 0);
    const votesAgainst = Number(proposal.votes_against || 0);
    const totalVotes = votesFor + votesAgainst;
    if (totalVotes === 0) {
      return "0 Votes • 0 Comments • Awaiting first vote";
    }
    return `${totalVotes} Vote${
      totalVotes === 1 ? "" : "s"
    } • 0 Comments • ${votesFor} For • ${votesAgainst} Against`;
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
    <Card className="bg-[#2A2A2A] border-gray-600 hover:border-gray-500 transition-colors">
      <CardContent className="p-6">
        {/* Default View */}
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 mt-1" />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-semibold text-white mb-2 leading-tight">
                  {proposal.title}
                </h4>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {getDAOInfo()}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    By{" "}
                    <a
                      href={getExplorerLink("address", proposal.creator)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      {truncateString(proposal.creator, 5, 5)}
                    </a>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(proposal.created_at), "MMM d, yyyy")}
                  </span>
                  <span>•</span>
                  <span>{getVoteSummary()}</span>
                  {proposal.status === "FAILED" && (
                    <>
                      <span>•</span>
                      <span>Ended</span>
                    </>
                  )}
                </div>

                {/* Status and Category Tags */}
                <div className="flex items-center gap-2 mb-3">
                  {getStatusBadge()}
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs px-2 py-0.5">
                    Message
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleVisibility(proposal.id)}
                className="text-gray-400 hover:text-white p-2"
              >
                {isHidden ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Vote Progress Bar (for active/completed proposals) */}
          {(proposal.status === "DEPLOYED" ||
            proposal.passed === true ||
            proposal.status === "FAILED") && (
            <div className="bg-[#1A1A1A] rounded-md p-3 border border-gray-600">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Voting Progress</span>
                <span className="text-gray-400">
                  {Number(proposal.votes_for || 0) +
                    Number(proposal.votes_against || 0)}{" "}
                  total votes
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-l-full transition-all duration-300"
                  style={{
                    width: `${
                      (Number(proposal.votes_for || 0) /
                        Math.max(
                          Number(proposal.votes_for || 0) +
                            Number(proposal.votes_against || 0),
                          1
                        )) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span className="text-green-400">
                  {Number(proposal.votes_for || 0)} For
                </span>
                <span className="text-red-400">
                  {Number(proposal.votes_against || 0)} Against
                </span>
              </div>
            </div>
          )}

          {/* View Details Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="self-start text-gray-400 hover:text-white p-2 h-auto"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                View Details
              </>
            )}
          </Button>
        </div>

        {/* Expanded Details - Integrated directly without nesting */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-600 space-y-6">
            {/* On-chain Message */}
            {proposal.parameters && (
              <div className="bg-[#1A1A1A] rounded-md p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white uppercase tracking-wide">
                    On-chain Message
                  </h4>
                </div>
                <MessageDisplay message={proposal.parameters} />
              </div>
            )}

            {/* Detailed Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full rounded-none bg-[#1A1A1A] justify-start border border-gray-600 p-1">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500 rounded-md px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="votes"
                  className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500 rounded-md px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Vote className="h-4 w-4 mr-2" />
                  Vote Details
                </TabsTrigger>
                <TabsTrigger
                  value="blockchain"
                  className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500 rounded-md px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Blocks className="h-4 w-4 mr-2" />
                  Blockchain
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                <ProposalMetrics proposal={proposal} />

                {/* Refresh button for active proposals */}
                {isActive && (
                  <div className="flex justify-end">
                    <div className="flex items-center gap-2">
                      {refreshing ? (
                        <span className="text-orange-500 flex items-center text-sm">
                          <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          {nextRefreshIn}s
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={refreshVotesData}
                        disabled={refreshing}
                        title="Refresh data"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${
                            refreshing ? "animate-spin" : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Timeline Status */}
                <div className="bg-[#1A1A1A] rounded-md p-4 border border-gray-600">
                  <h4 className="text-sm uppercase tracking-wide mb-3 text-white">
                    Timeline Status
                  </h4>
                  <TimeStatus
                    createdAt={proposal.created_at}
                    status={proposal.status}
                    concludedBy={proposal.concluded_by}
                    vote_start={proposal.vote_start}
                    vote_end={proposal.vote_end}
                  />
                </div>
              </TabsContent>

              {/* Votes Tab */}
              <TabsContent value="votes" className="mt-4">
                <div className="space-y-4">
                  <div className="bg-[#1A1A1A] rounded-md p-4 border border-gray-600">
                    <h4 className="text-sm uppercase tracking-wide mb-3 text-white flex items-center gap-2">
                      Voting Results
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 cursor-pointer text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              Current voting results and participation
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h4>
                    <VoteProgress
                      contractAddress={proposal.contract_principal}
                      proposalId={proposal.proposal_id}
                      votesFor={proposal.votes_for}
                      votesAgainst={proposal.votes_against}
                      refreshing={refreshing}
                      tokenSymbol={proposal.token_symbol || ""}
                      liquidTokens={
                        proposal.liquid_tokens !== null
                          ? proposal.liquid_tokens.toString()
                          : "0"
                      }
                      isActive={isActive}
                    />
                  </div>

                  <VotesTable proposalId={proposal.id} />
                </div>
              </TabsContent>

              {/* Blockchain Tab */}
              <TabsContent value="blockchain" className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Block Information */}
                  <div className="bg-[#1A1A1A] rounded-md p-4 border border-gray-600">
                    <h4 className="text-sm uppercase tracking-wide mb-3 text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-orange-500" />
                      Block Information
                    </h4>
                    <div className="space-y-3 text-sm">
                      <LabeledField
                        icon={Layers}
                        label="Snapshot block"
                        value={
                          <BlockVisual
                            value={proposal.created_stx}
                            type="stacks"
                          />
                        }
                      />
                      <LabeledField
                        icon={ArrowRight}
                        label="Start block"
                        value={
                          <BlockVisual
                            value={proposal.vote_start}
                            type="bitcoin"
                          />
                        }
                      />
                      <LabeledField
                        icon={Timer}
                        label="End block"
                        value={
                          <BlockVisual
                            value={proposal.vote_end}
                            type="bitcoin"
                          />
                        }
                      />
                    </div>
                  </div>

                  {/* Contract Details */}
                  <div className="bg-[#1A1A1A] rounded-md p-4 border border-gray-600">
                    <h4 className="text-sm uppercase tracking-wide mb-3 text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                      Contract Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      <LabeledField
                        icon={Wallet}
                        label="Principal"
                        value={formatAction(proposal.contract_principal)}
                        link={getExplorerLink(
                          "contract",
                          proposal.contract_principal
                        )}
                      />
                      <LabeledField
                        icon={Activity}
                        label="Action"
                        value={formatAction(proposal.action)}
                        link={
                          proposal.action
                            ? getExplorerLink("contract", proposal.action)
                            : undefined
                        }
                      />
                      <LabeledField
                        icon={Hash}
                        label="Proposal ID"
                        value={`#${proposal.proposal_id}`}
                      />
                      <LabeledField
                        icon={Hash}
                        label="Transaction ID"
                        value={truncateString(proposal.tx_id, 8, 8)}
                        link={getExplorerLink("tx", proposal.tx_id)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AllProposals;
