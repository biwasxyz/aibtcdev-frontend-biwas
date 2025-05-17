"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MessageDisplay from "./MessageDisplay";
import VoteProgress from "./VoteProgress";
import TimeStatus, { useVotingStatus } from "./TimeStatus";
import BlockVisual from "./BlockVisual";
import VotesTable from "./VotesTable";
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
} from "lucide-react";
import { truncateString, formatAction, getExplorerLink } from "./helper";
import type { Proposal } from "@/types/supabase";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LabeledField from "./LabeledField";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ProposalMetrics from "./ProposalMetrics";

const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(60);
  const queryClient = useQueryClient();

  // Get voting status
  const { isActive, isEnded } = useVotingStatus(
    proposal.status,
    proposal.start_block,
    proposal.end_block
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

  // Get card border color based on status
  const getCardBorderColor = () => {
    if (isActive) return "border-l-primary";
    if (isExecuted) return "border-l-primary";
    if (isPending) return "border-l-amber-500";
    if (isFailed) return "border-l-zinc-500";
    return "";
  };

  // Get status badge
  const getStatusBadge = () => {
    if (isActive) {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/30 flex items-center gap-1 px-1.5 py-0.5 text-xs">
          <Vote className="h-3 w-3" />
          <span>Voting Active</span>
        </Badge>
      );
    }

    if (isExecuted) {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/30 flex items-center gap-1 px-1.5 py-0.5 text-xs">
          <CheckCircle className="h-3 w-3" />
          <span>Executed</span>
        </Badge>
      );
    }

    if (isPending) {
      return (
        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 flex items-center gap-1 px-1.5 py-0.5 text-xs">
          <Clock className="h-3 w-3" />
          <span>Pending Execution</span>
        </Badge>
      );
    }

    if (isFailed) {
      return (
        <Badge className="bg-zinc-800/50 text-zinc-400 flex items-center gap-1 px-1.5 py-0.5 text-xs">
          <XCircle className="h-3 w-3" />
          <span>Failed</span>
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="flex items-center gap-1 px-1.5 py-0.5 text-xs"
      >
        <Timer className="h-3 w-3" />
        <span>Pending</span>
      </Badge>
    );
  };

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-sm hover:shadow-md border-t-0 border-r-0 border-b-0  bg-background",
        getCardBorderColor()
      )}
    >
      {/* Header Section - Improved hierarchy */}
      <CardHeader className="p-6 pb-3">
        <div className="flex flex-col gap-3">
          {/* Title - Full width, prominent */}
          <h3 className="text-xl font-semibold leading-tight">
            {proposal.title}
          </h3>

          {/* Meta information - Single line with status badge on right */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 text-xs  leading-tight">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(proposal.created_at), "MMM d, yyyy")}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3" />
                <span>Created by:</span>
                <a
                  href={getExplorerLink("address", proposal.creator)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  {truncateString(proposal.creator, 5, 5)}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>

              {proposal.concluded_by && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  <span>Concluded by:</span>
                  <a
                    href={getExplorerLink("address", proposal.concluded_by)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    {truncateString(proposal.concluded_by, 5, 5)}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Status badge - Right aligned */}
            <div>{getStatusBadge()}</div>
          </div>
        </div>
      </CardHeader>

      {/* Proposal Message - Always show full message */}
      {proposal.parameters && (
        <div className="px-6 pt-2 pb-3">
          <div className="rounded-md bg-zinc-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium uppercase tracking-wide ">
                On-chain Message
              </h4>
            </div>
            <MessageDisplay message={proposal.parameters} />
          </div>
        </div>
      )}

      {/* Main Content - Compact Layout */}
      <CardContent className="p-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full rounded-none bg-zinc-900/30 px-6 justify-start">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1.5 h-9"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="votes"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1.5 h-9"
            >
              <Vote className="h-3.5 w-3.5" />
              <span>Vote Details</span>
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1.5 h-9"
            >
              <Blocks className="h-3.5 w-3.5" />
              <span>Blockchain Details</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Compact Grid Layout */}
          <TabsContent value="overview" className="p-6 space-y-4">
            {/* Proposal Metrics - Using the updated component */}
            <ProposalMetrics proposal={proposal} />

            {/* Refresh button for active proposals */}
            {isActive && (
              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  {refreshing ? (
                    <span className="text-primary flex items-center text-xs">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    <span className="text-xs ">{nextRefreshIn}s</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={refreshVotesData}
                    disabled={refreshing}
                    title="Refresh data"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </div>
            )}

            {/* Voting Progress */}
            <div className="bg-zinc-900/10 p-3 rounded-md">
              <h4 className="text-xs uppercase tracking-wide  mb-2 flex items-center gap-1.5">
                Voting Result
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3  cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
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
              />
            </div>

            {/* Timeline - Full version */}
            <div className="bg-zinc-900/10 p-3 rounded-md">
              <h4 className="text-xs uppercase tracking-wide  mb-2 flex items-center gap-1.5">
                Timeline
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3  cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Proposal timeline and status</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h4>
              <TimeStatus
                createdAt={proposal.created_at}
                concludedBy={proposal.concluded_by}
                status={proposal.status}
                start_block={proposal.start_block}
                end_block={proposal.end_block}
              />
            </div>
          </TabsContent>

          {/* Votes Tab - Simplified */}
          <TabsContent value="votes" className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5">
                <Vote className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-sm font-medium">Detailed Vote Record</h4>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={refreshVotesData}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>

            <div className="bg-zinc-900/10 p-3 rounded-md">
              <VotesTable proposalId={proposal.id} />
            </div>
          </TabsContent>

          {/* Details Tab - Simplified */}
          <TabsContent value="details" className="p-6 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Block Information */}
              <div className="space-y-3 bg-zinc-900/10 p-3 rounded-md">
                <h4 className="text-xs uppercase tracking-wide  flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Block Information</span>
                </h4>

                <div className="space-y-2 text-xs leading-tight">
                  <LabeledField
                    icon={Layers}
                    label="Snapshot block"
                    value={
                      <BlockVisual
                        value={proposal.created_at_block}
                        type="stacks"
                      />
                    }
                  />
                  <LabeledField
                    icon={ArrowRight}
                    label="Start block"
                    value={
                      <BlockVisual
                        value={proposal.start_block}
                        type="bitcoin"
                      />
                    }
                  />
                  <LabeledField
                    icon={Timer}
                    label="End block"
                    value={
                      <BlockVisual value={proposal.end_block} type="bitcoin" />
                    }
                  />
                </div>
              </div>

              {/* Blockchain Details */}
              <div className="space-y-3 bg-zinc-900/10 p-3 rounded-md">
                <h4 className="text-xs uppercase tracking-wide  flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>Blockchain Details</span>
                </h4>

                <div className="space-y-2 text-xs leading-tight">
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

            {/* Execution Details */}
            {isEnded && (
              <div className="space-y-3 bg-zinc-900/10 p-3 rounded-md">
                <h4 className="text-xs uppercase tracking-wide  flex items-center gap-1.5">
                  {proposal.passed ? (
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                  <span>Execution Details</span>
                </h4>

                <div className="space-y-2 text-xs leading-tight">
                  <p>
                    {proposal.passed
                      ? "This proposal has passed and " +
                        (proposal.executed === true
                          ? "has been executed."
                          : "is pending execution.")
                      : "This proposal has failed and will not be executed."}
                  </p>

                  {proposal.concluded_by && (
                    <div className="flex items-center gap-1.5 text-xs mt-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Concluded by:
                      </span>
                      <a
                        href={getExplorerLink("address", proposal.concluded_by)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {truncateString(proposal.concluded_by, 5, 5)}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
