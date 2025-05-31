"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MessageDisplay from "@/components/daos/proposal/MessageDisplay";
import VoteProgress from "@/components/daos/proposal/VoteProgress";
import TimeStatus, {
  useVotingStatus,
} from "@/components/daos/proposal/TimeStatus";
import BlockVisual from "@/components/daos/proposal/BlockVisual";
import VotesTable from "@/components/daos/proposal/VotesTable";
import {
  ArrowRight,
  Timer,
  Layers,
  Wallet,
  User,
  Activity,
  Hash,
  FileText,
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Vote,
  Blocks,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import {
  truncateString,
  formatAction,
  getExplorerLink,
} from "@/helpers/helper";
import type { Proposal } from "@/types/supabase";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LabeledField from "@/components/daos/proposal/LabeledField";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ProposalMetrics from "@/components/daos/proposal/ProposalMetrics";

const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(60);
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  // Get voting status
  const { isActive, isEnded } = useVotingStatus(
    proposal.status,
    proposal.vote_start,
    proposal.vote_end,
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

  // Get status badge with updated colors
  const getStatusBadge = () => {
    if (proposal.status === "DEPLOYED" && isActive) {
      return (
        <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 flex items-center gap-1.5 px-3 py-1">
          <Vote className="h-3.5 w-3.5" />
          <span>Active</span>
        </Badge>
      );
    }

    if (isExecuted) {
      return (
        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 flex items-center gap-1.5 px-3 py-1">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Passed</span>
        </Badge>
      );
    }

    if (proposal.status === "FAILED" || isFailed) {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30 flex items-center gap-1.5 px-3 py-1">
          <XCircle className="h-3.5 w-3.5" />
          <span>Failed</span>
        </Badge>
      );
    }

    if (proposal.status === "PENDING") {
      return (
        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 flex items-center gap-1.5 px-3 py-1">
          <Clock className="h-3.5 w-3.5" />
          <span>Pending</span>
        </Badge>
      );
    }

    return (
      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 flex items-center gap-1.5 px-3 py-1">
        <Timer className="h-3.5 w-3.5" />
        <span>Draft</span>
      </Badge>
    );
  };

  // Get border color based on status
  const getBorderColor = () => {
    if (proposal.status === "DEPLOYED" && isActive)
      return "border-l-orange-500";
    if (isExecuted) return "border-l-green-500";
    if (proposal.status === "FAILED" || isFailed) return "border-l-red-500";
    return "border-l-gray-600";
  };

  return (
    <Card
      className={cn(
        "bg-[#2A2A2A] border-gray-600 border-l-4",
        getBorderColor(),
      )}
    >
      {/* Simplified Header */}
      <CardHeader className="p-6 pb-4">
        <div className="flex flex-col gap-3">
          {/* Title and Status Row */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-semibold text-white leading-tight flex-1">
              {proposal.title}
            </h3>
            {getStatusBadge()}
          </div>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(proposal.created_at), "MMM d, yyyy")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>By:</span>
              <a
                href={getExplorerLink("address", proposal.creator)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                {truncateString(proposal.creator, 5, 5)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {proposal.parameters && (
              <div className="flex items-center gap-2 text-gray-500">
                <MessageSquare className="h-4 w-4" />
                <span>Has message</span>
              </div>
            )}
          </div>

          {/* Quick Voting Summary (if active or recently concluded) */}
          {(isActive || isExecuted || isFailed) && (
            <div className="bg-[#1A1A1A] rounded-md p-3 border border-gray-600">
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
          )}

          {/* Expand/Collapse Button */}
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
      </CardHeader>

      {/* Collapsible Content */}
      {isExpanded && (
        <CardContent className="p-0 border-t border-gray-600">
          {/* Proposal Message */}
          {proposal.parameters && (
            <div className="p-6 pb-4 border-b border-gray-600">
              <div className="bg-[#1A1A1A] rounded-md p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white uppercase tracking-wide">
                    On-chain Message
                  </h4>
                </div>
                <MessageDisplay message={proposal.parameters} />
              </div>
            </div>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full rounded-none bg-[#1A1A1A] px-6 justify-start border-b border-gray-600">
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
            <TabsContent value="overview" className="p-6 space-y-4 m-0">
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
            <TabsContent value="votes" className="p-6 m-0">
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
            <TabsContent value="blockchain" className="p-6 m-0">
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
                        <BlockVisual value={proposal.vote_end} type="bitcoin" />
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
                        proposal.contract_principal,
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
        </CardContent>
      )}
    </Card>
  );
};

export default ProposalCard;
