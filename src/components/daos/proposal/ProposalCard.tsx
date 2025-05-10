"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MessageDisplay from "./MessageDisplay";
import VoteProgress from "./VoteProgress";
import TimeStatus, { useVotingStatus } from "./TimeStatus";
import ProposalMetrics from "./ProposalMetrics";
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
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { truncateString, formatAction, getExplorerLink } from "./helper";
import type { Proposal } from "@/types/supabase";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LabeledField from "./LabeledField";

const ProposalCard: React.FC<{ proposal: Proposal }> = ({ proposal }) => {
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(60);
  const queryClient = useQueryClient();

  // Get voting status
  const { isActive, isEnded, isLoading } = useVotingStatus(
    proposal.status,
    proposal.start_block,
    proposal.end_block
  );

  // Refresh votes data
  const refreshVotesData = useCallback(async () => {
    setRefreshing(true);
    setNextRefreshIn(60);

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
    }
  }, [queryClient, proposal.contract_principal, proposal.proposal_id]);

  return (
    <Card className="overflow-hidden bg-zinc-900 border-zinc-800 mb-6 w-full">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 p-4 sm:p-6 border-b border-zinc-800">
        <div className="flex flex-col gap-3">
          {/* Title and Status */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-xl font-bold">{proposal.title}</h3>

            <div className="flex flex-wrap gap-2">
              {isLoading ? (
                <Badge variant="outline" className="animate-pulse">
                  Loading...
                </Badge>
              ) : isActive ? (
                <Badge className="bg-blue-500 text-white hover:bg-blue-600">
                  Active
                </Badge>
              ) : isEnded ? (
                <Badge
                  className={
                    proposal.passed
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }
                >
                  {proposal.passed ? "Passed" : "Failed"}
                </Badge>
              ) : (
                <Badge variant="outline">Pending</Badge>
              )}

              {proposal.status === "FAILED" && (
                <Badge variant="destructive">Execution Failed</Badge>
              )}
            </div>
          </div>

          {/* Creator and Date */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <a
                href={getExplorerLink("address", proposal.creator)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {truncateString(proposal.creator, 6, 4)}
              </a>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(proposal.created_at), "MMM d, yyyy")}
              </span>
            </div>

            {isActive && (
              <div className="flex items-center gap-1.5 ml-auto text-blue-400">
                <Timer className="h-4 w-4" />
                <span>Voting in progress</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <CardContent className="p-0">
        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b border-zinc-800">
            <TabsList className="h-12 w-full rounded-none bg-zinc-900 border-b border-zinc-800">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-zinc-800"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="votes"
                className="data-[state=active]:bg-zinc-800"
              >
                Detailed Vote Record
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-zinc-800"
              >
                Blockchain Details
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4 sm:p-6 space-y-6">
            {/* Proposal Message/Parameters */}
            {proposal.parameters && (
              <div className="rounded-lg border border-zinc-700 p-4 bg-zinc-800/30">
                <MessageDisplay message={proposal.parameters} />
              </div>
            )}

            {/* Voting Progress */}
            <div className="rounded-lg border border-zinc-700 p-4 bg-zinc-800/30">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium">Voting Progress</h4>
                </div>

                <div className="flex items-center gap-2">
                  {isActive && (
                    <span className="text-xs text-muted-foreground">
                      {refreshing ? (
                        <span className="text-blue-400 flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        <span>Updating in {nextRefreshIn}s</span>
                      )}
                    </span>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={refreshVotesData}
                    disabled={refreshing}
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 mr-1.5 ${
                        refreshing ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                </div>
              </div>

              <VoteProgress
                contractAddress={proposal.contract_principal}
                proposalId={proposal.proposal_id}
                votesFor={proposal.votes_for}
                votesAgainst={proposal.votes_against}
                refreshing={refreshing}
                tokenSymbol={proposal.token_symbol || ""}
                liquidTokens={proposal.liquid_tokens || "0"}
              />
            </div>

            {/* Time Status */}
            <TimeStatus
              createdAt={proposal.created_at}
              concludedBy={proposal.concluded_by}
              status={proposal.status}
              start_block={proposal.start_block}
              end_block={proposal.end_block}
            />

            {/* Proposal Metrics */}
            <ProposalMetrics proposal={proposal} />

            {/* Execution Status */}
            {isEnded && (
              <div
                className={`rounded-lg border p-4 ${
                  proposal.passed
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                  {proposal.passed ? (
                    <ThumbsUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <ThumbsDown className="h-5 w-5 text-red-500" />
                  )}
                  <span>Execution Status</span>
                </h4>

                <div className="space-y-2">
                  <p className="text-sm">
                    {proposal.passed
                      ? "This proposal has passed and " +
                        (proposal.executed
                          ? "has been executed."
                          : "is pending execution.")
                      : "This proposal has failed and will not be executed."}
                  </p>

                  {proposal.concluded_by && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Concluded by:
                      </span>
                      <a
                        href={getExplorerLink("address", proposal.concluded_by)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {truncateString(proposal.concluded_by, 6, 4)}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Votes Tab */}
          <TabsContent value="votes" className="p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <h4 className="font-medium text-lg">Detailed Vote Record</h4>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={refreshVotesData}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1.5 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh Votes
              </Button>
            </div>

            <div className="rounded-lg border border-zinc-700 overflow-hidden">
              <VotesTable proposalId={proposal.id} />
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Block Information */}
              <div className="rounded-lg border border-zinc-700 p-4 bg-zinc-800/30">
                <h4 className="font-medium text-base mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-500" />
                  <span>Block Information</span>
                </h4>

                <div className="space-y-4">
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
              <div className="rounded-lg border border-zinc-700 p-4 bg-zinc-800/30">
                <h4 className="font-medium text-base mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span>Blockchain Details</span>
                </h4>

                <div className="space-y-4">
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
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
