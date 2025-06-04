"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProposalVotes } from "@/queries/vote-queries";
import { TokenBalance } from "@/components/reusables/BalanceDisplay";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, Clock, Info, Users, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeNumberFromBigInt } from "@/helpers/proposal-utils";
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
  const proposalId = proposal.id

  const { data: individualVotes } = useQuery({
    queryKey: ["proposalVotes", proposalId],
    queryFn: async () => {
      if (proposalId) {
        return fetchProposalVotes(proposalId);
      }
      return [];
    },
    enabled: !!proposalId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60, // 1 minute
  });

  // Calculate vote totals from individual votes
  useEffect(() => {
    if (individualVotes && individualVotes.length > 0) {
      let votesFor = 0;
      let votesAgainst = 0;

      individualVotes.forEach(vote => {
        const amount = Number(vote.amount || "0");
        if (vote.answer === true) {
          votesFor += amount;
        } else if (vote.answer === false) {
          votesAgainst += amount;
        }
      });

      setParsedVotes({
        votesFor: votesFor.toString(),
        votesAgainst: votesAgainst.toString(),
      });
    } else {
      // If no individual votes, fall back to proposal data
      setParsedVotes({
        votesFor: proposal.votes_for ? proposal.votes_for.replace(/n$/, "") : "0",
        votesAgainst: proposal.votes_against ? proposal.votes_against.replace(/n$/, "") : "0",
      });
    }
  }, [individualVotes, proposal.votes_for, proposal.votes_against]);

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
            <span className="text-sm font-medium text-foreground">
              Participation: {calculations.participationRate.toFixed(1)}% 
            </span>
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
          <div className="text-sm">
            <span className={cn(
              "font-medium",
              calculations.metQuorum ? "text-green-400" : "text-red-400"
            )}>
              {calculations.metQuorum ? "✓ Quorum Met" : "✗ Quorum Missed"}
            </span>
          </div>
        </div>

        <div className="relative">
          {/* Background bar */}
          <div className="h-6 bg-muted rounded-lg overflow-hidden">
            {/* Votes for (green) */}
            <div
              className={`absolute left-0 top-0 h-full bg-green-500/80 transition-all duration-500 ease-out ${
                calculations.votesForPercent > 0 ? 'rounded-l-lg' : ''
              } ${
                calculations.votesAgainstPercent === 0 && calculations.votesForPercent > 0 ? 'rounded-r-lg' : ''
              }`}
              style={{ width: `${Math.min(calculations.votesForPercent, 100)}%` }}
            />
            {/* Votes against (red) */}
            <div
              className={`absolute top-0 h-full bg-red-500/80 transition-all duration-500 ease-out ${
                calculations.votesAgainstPercent > 0 && (calculations.votesForPercent + calculations.votesAgainstPercent >= 100 || calculations.votesForPercent === 0) ? 'rounded-r-lg' : ''
              } ${
                calculations.votesForPercent === 0 && calculations.votesAgainstPercent > 0 ? 'rounded-l-lg' : ''
              }`}
              style={{
                width: `${Math.min(calculations.votesAgainstPercent, 100)}%`,
                left: `${Math.min(calculations.votesForPercent, 100)}%`,
              }}
            />
          </div>

          {/* Quorum line indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
            style={{ left: `calc(${Math.min(calculations.quorumRate, 100)}% - 1px)` }}
          >
            <div className="absolute -top-1 w-3 h-3 bg-primary rounded-full border-2 border-background" style={{ left: '-5px' }} />
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

      {/* Approval Rate Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Approval Rate: {calculations.approvalRate.toFixed(1)}% 
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Percentage of votes in favor out of total votes cast
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-sm">
            <span className={cn(
              "font-medium",
              calculations.metThreshold ? "text-green-400" : "text-red-400"
            )}>
              {calculations.metThreshold ? "✓ Threshold Met" : "✗ Threshold Missed"}
            </span>
          </div>
        </div>

        <div className="relative">
          {/* Background bar */}
          <div className="h-6 bg-muted rounded-lg overflow-hidden">
            {/* Approval rate (green) */}
            <div
              className={`absolute left-0 top-0 h-full bg-green-500/80 transition-all duration-500 ease-out ${
                calculations.approvalRate > 0 ? 'rounded-l-lg' : ''
              } ${
                calculations.approvalRate >= 95 ? 'rounded-r-lg' : ''
              }`}
              style={{ width: `${Math.min(calculations.approvalRate, 100)}%` }}
            />
          </div>

          {/* Threshold line indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
            style={{ left: `calc(${Math.min(calculations.thresholdPercentage, 100)}% - 1px)` }}
          >
            <div className="absolute -top-1 w-3 h-3 bg-primary rounded-full border-2 border-background" style={{ left: '-5px' }} />
          </div>
        </div>

        {/* Approval breakdown */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Approval: {calculations.approvalRate.toFixed(1)}% of votes cast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span>Threshold: {calculations.thresholdPercentage}%</span>
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
              Participation: {calculations.participationRate.toFixed(1)}% {calculations.metQuorum ? '≥' : '<'} Quorum: {calculations.quorumPercentage}%
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
              Approval: {calculations.approvalRate.toFixed(1)}% {calculations.metThreshold ? '≥' : '<'} Threshold: {calculations.thresholdPercentage}%
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
              {calculations.totalVotes > 0 ? (
                <div className="space-y-1">
                  <div>{calculations.totalVotes} total votes</div>
                  {!isActive && isEnded && !proposal.passed && calculations.metQuorum && calculations.metThreshold && (
                    <div className="text-orange-400">
                      ⚠️ Failed despite meeting quorum & threshold
                    </div>
                  )}
                </div>
              ) : (
                "No votes yet"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingProgressChart; 