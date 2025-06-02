"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProposalVotes } from "@/lib/vote-utils";
import { TokenBalance } from "@/components/reusables/BalanceDisplay";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, Clock, Info, Users, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeNumberFromBigInt, safeString, safeStringFromBigInt } from "@/helpers/proposal-utils";
import type { Proposal, ProposalWithDAO } from "@/types/supabase";
import { useVotingStatus } from "./TimeStatus";

interface VotingProgressChartProps {
  proposal: Proposal | ProposalWithDAO;
  tokenSymbol?: string;
}

const VotingProgressChart = ({ proposal, tokenSymbol = "" }: VotingProgressChartProps) => {
  const { isActive, isEnded } = useVotingStatus(
    proposal.status,
    safeNumberFromBigInt(proposal.vote_start),
    safeNumberFromBigInt(proposal.vote_end),
  );

  // State to store parsed vote values from live data
  const [parsedVotes, setParsedVotes] = useState({
    votesFor: proposal.votes_for ? proposal.votes_for.replace(/n$/, "") : "0",
    votesAgainst: proposal.votes_against ? proposal.votes_against.replace(/n$/, "") : "0",
  });

  // Fetch live vote data
  const contractAddress = safeString(proposal.contract_principal);
  const proposalId = safeStringFromBigInt(proposal.proposal_id);

  const { data: liveVoteData } = useQuery({
    queryKey: ["proposalVotes", contractAddress, proposalId],
    queryFn: async () => {
      if (contractAddress && proposalId) {
        return getProposalVotes(contractAddress, Number(proposalId));
      }
      return null;
    },
    enabled: !!contractAddress && !!proposalId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60, // 1 minute
  });

  // Update parsed votes when live data changes
  useEffect(() => {
    if (liveVoteData) {
      setParsedVotes({
        votesFor: liveVoteData.votesFor || "0",
        votesAgainst: liveVoteData.votesAgainst || "0",
      });
    }
  }, [liveVoteData]);

  const calculations = useMemo(() => {
    const votesFor = Number(parsedVotes.votesFor || 0);
    const votesAgainst = Number(parsedVotes.votesAgainst || 0);
    const totalVotes = votesFor + votesAgainst;
    const liquidTokens = Number(proposal.liquid_tokens || 0);
    const quorumPercentage = safeNumberFromBigInt(proposal.voting_quorum); // Already a percentage (e.g., 20 = 20%)
    const thresholdPercentage = safeNumberFromBigInt(proposal.voting_threshold); // Already a percentage (e.g., 60 = 60%)
    
    // Calculate percentages based on liquid tokens
    const participationRate = liquidTokens > 0 ? (totalVotes / liquidTokens) * 100 : 0;
    const quorumRate = quorumPercentage; // Already a percentage
    
    // Calculate approval rate from cast votes
    const approvalRate = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
    const thresholdRate = thresholdPercentage; // Already a percentage
    
    // Calculate vote breakdown percentages
    const votesForPercent = liquidTokens > 0 ? (votesFor / liquidTokens) * 100 : 0;
    const votesAgainstPercent = liquidTokens > 0 ? (votesAgainst / liquidTokens) * 100 : 0;
    
    // Calculate required token amounts for display
    const quorumTokensRequired = liquidTokens > 0 ? (liquidTokens * quorumPercentage) / 100 : 0;
    
    // Calculate if requirements are actually met based on current data
    const actuallyMetQuorum = participationRate >= quorumPercentage;
    const actuallyMetThreshold = totalVotes > 0 ? approvalRate >= thresholdPercentage : false;
    
    return {
      votesFor,
      votesAgainst,
      totalVotes,
      liquidTokens,
      quorumPercentage,
      thresholdPercentage,
      quorumTokensRequired,
      thresholdRate,
      participationRate,
      quorumRate,
      approvalRate,
      votesForPercent,
      votesAgainstPercent,
      metQuorum: actuallyMetQuorum,
      metThreshold: actuallyMetThreshold,
    };
  }, [proposal, parsedVotes]);

  const getStatusColor = (met: boolean, isActive: boolean) => {
    if (isActive) return "text-orange-400";
    return met ? "text-green-400" : "text-red-400";
  };

  const getStatusIcon = (met: boolean, isActive: boolean) => {
    if (isActive) return <Clock className="h-4 w-4" />;
    return met ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;
  };

  const getStatusText = (met: boolean, isActive: boolean) => {
    if (isActive) return "Pending";
    return met ? "Met" : "Missed";
  };

  return (
    <div className="space-y-6">
      {/* Participation Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Participation</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Total votes cast vs. total liquid tokens available
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-sm text-muted-foreground">
            {calculations.participationRate.toFixed(1)}%
          </div>
        </div>

        <div className="relative">
          {/* Background bar */}
          <div className="h-6 bg-muted rounded-lg overflow-hidden">
            {/* Votes for (green) */}
            <div
              className="absolute h-full bg-green-500/80 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(calculations.votesForPercent, 100)}%` }}
            />
            {/* Votes against (red) */}
            <div
              className="absolute h-full bg-red-500/80 transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(calculations.votesAgainstPercent, 100)}%`,
                left: `${Math.min(calculations.votesForPercent, 100)}%`,
              }}
            />
          </div>

          {/* Quorum line indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
            style={{ left: `${Math.min(calculations.quorumRate, 100)}%` }}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
          </div>
        </div>

        {/* Vote breakdown */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>For: <TokenBalance value={calculations.votesFor.toString()} decimals={8} variant="abbreviated" symbol={tokenSymbol} /></span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Against: <TokenBalance value={calculations.votesAgainst.toString()} decimals={8} variant="abbreviated" symbol={tokenSymbol} /></span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span>Quorum: <TokenBalance value={calculations.quorumTokensRequired.toString()} decimals={8} variant="abbreviated" symbol={tokenSymbol} /> ({calculations.quorumPercentage}%)</span>
          </div>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Quorum Status */}
        <div className={cn(
          "p-4 rounded-lg border transition-colors",
          isActive || !isEnded
            ? "bg-orange-500/10 border-orange-500/30"
            : calculations.metQuorum
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
        )}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Quorum
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(calculations.metQuorum, isActive || !isEnded)}
              <span className={cn("text-sm font-semibold", getStatusColor(calculations.metQuorum, isActive || !isEnded))}>
                {getStatusText(calculations.metQuorum, isActive || !isEnded)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {calculations.participationRate.toFixed(1)}% of {calculations.quorumPercentage}% needed
            </div>
          </div>
        </div>

        {/* Threshold Status */}
        <div className={cn(
          "p-4 rounded-lg border transition-colors",
          isActive || !isEnded
            ? "bg-orange-500/10 border-orange-500/30"
            : calculations.metThreshold
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
        )}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Threshold
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(calculations.metThreshold, isActive || !isEnded)}
              <span className={cn("text-sm font-semibold", getStatusColor(calculations.metThreshold, isActive || !isEnded))}>
                {getStatusText(calculations.metThreshold, isActive || !isEnded)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {calculations.approvalRate.toFixed(1)}% of {calculations.thresholdPercentage}% needed
            </div>
          </div>
        </div>

        {/* Overall Result */}
        <div className={cn(
          "p-4 rounded-lg border transition-colors",
          isActive || !isEnded
            ? "bg-orange-500/10 border-orange-500/30"
            : proposal.passed
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
        )}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Result
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(proposal.passed, isActive || !isEnded)}
              <span className={cn("text-sm font-semibold", getStatusColor(proposal.passed, isActive || !isEnded))}>
                {isActive || !isEnded ? "Pending" : proposal.passed ? "Passed" : "Failed"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {calculations.totalVotes > 0 ? `${calculations.totalVotes} total votes` : "No votes yet"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingProgressChart; 