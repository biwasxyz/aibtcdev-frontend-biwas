"use client";

import type React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProposalVotes } from "@/lib/vote-utils";
import { useMemo, useState, useEffect } from "react";
import { TokenBalance } from "@/components/reusables/balance-display";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface VoteProgressProps {
  votesFor?: string;
  votesAgainst?: string;
  contractAddress?: string;
  proposalId?: string | number;
  refreshing?: boolean;
  tokenSymbol?: string;
  liquidTokens: string | number | null; // Required, but can be null
}

const VoteProgress: React.FC<VoteProgressProps> = ({
  votesFor: initialVotesFor,
  votesAgainst: initialVotesAgainst,
  contractAddress,
  proposalId,
  refreshing = false,
  tokenSymbol = "",
  liquidTokens = "0", // Default to "0" if null
}) => {
  // Memoize initial votes parsing
  const initialParsedVotes = useMemo(() => {
    const parsedFor = initialVotesFor ? initialVotesFor.replace(/n$/, "") : "0";
    const parsedAgainst = initialVotesAgainst
      ? initialVotesAgainst.replace(/n$/, "")
      : "0";

    return {
      votesFor: parsedFor,
      votesAgainst: parsedAgainst,
    };
  }, [initialVotesFor, initialVotesAgainst]);

  // State to store parsed vote values
  const [parsedVotes, setParsedVotes] = useState(initialParsedVotes);

  // Memoize query options to prevent unnecessary refetches
  const queryOptions = useMemo(
    () => ({
      queryKey: ["proposalVotes", contractAddress, proposalId, refreshing],
      queryFn: async () => {
        if (contractAddress && proposalId) {
          return getProposalVotes(
            contractAddress,
            Number(proposalId),
            refreshing
          );
        }
        return null;
      },
      enabled: !!contractAddress && !!proposalId,
      refetchOnWindowFocus: false,
    }),
    [contractAddress, proposalId, refreshing]
  );

  // Use useQuery with memoized options
  const { data, isLoading, error } = useQuery(queryOptions);

  // Memoize vote calculations to prevent unnecessary recalculations
  const voteCalculations = useMemo(() => {
    const votesForNum = Number(parsedVotes.votesFor) || 0;
    const votesAgainstNum = Number(parsedVotes.votesAgainst) || 0;
    const totalVotes = votesForNum + votesAgainstNum;
    const liquidTokensNum = Number(liquidTokens) || 0;

    // Calculate percentages based on total liquid tokens
    const percentageFor =
      liquidTokensNum > 0 ? (votesForNum / liquidTokensNum) * 100 : 0;
    const percentageAgainst =
      liquidTokensNum > 0 ? (votesAgainstNum / liquidTokensNum) * 100 : 0;
    const percentageRemaining = Math.max(
      0,
      100 - percentageFor - percentageAgainst
    );

    // Also calculate percentages of cast votes for the tooltip
    const castPercentageFor =
      totalVotes > 0 ? (votesForNum / totalVotes) * 100 : 0;
    const castPercentageAgainst =
      totalVotes > 0 ? (votesAgainstNum / totalVotes) * 100 : 0;

    return {
      votesForNum,
      votesAgainstNum,
      totalVotes,
      liquidTokensNum,
      percentageFor,
      percentageAgainst,
      percentageRemaining,
      castPercentageFor,
      castPercentageAgainst,
    };
  }, [parsedVotes, liquidTokens]);

  // Update parsed votes when data changes
  useEffect(() => {
    if (data) {
      setParsedVotes({
        votesFor: data.votesFor || "0",
        votesAgainst: data.votesAgainst || "0",
      });
    }
  }, [data]);

  if (isLoading && !refreshing) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse"></div>
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">Error: {(error as Error).message}</div>
    );
  }

  return (
    <div className="space-y-4">
      {voteCalculations.totalVotes === 0 ? (
        <div className="py-4 text-center bg-zinc-800 rounded-lg">
          Awaiting first vote from agent
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium">Voting Progress</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    This bar shows votes relative to total liquid tokens.
                    <br />
                    <span className="text-green-500">■</span> For:{" "}
                    {voteCalculations.percentageFor.toFixed(1)}% of liquid
                    tokens
                    <br />
                    <span className="text-red-500">■</span> Against:{" "}
                    {voteCalculations.percentageAgainst.toFixed(1)}% of liquid
                    tokens
                    <br />
                    <span className="text-zinc-500">■</span> Remaining:{" "}
                    {voteCalculations.percentageRemaining.toFixed(1)}% of liquid
                    tokens
                    <br />
                    <br />
                    Of cast votes:{" "}
                    {voteCalculations.castPercentageFor.toFixed(1)}% For,{" "}
                    {voteCalculations.castPercentageAgainst.toFixed(1)}% Against
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="relative h-6 bg-zinc-700/30 rounded-full overflow-hidden">
            {/* For votes */}
            <div
              className="absolute h-full bg-green-500/80 left-0"
              style={{ width: `${voteCalculations.percentageFor}%` }}
            ></div>

            {/* Against votes */}
            <div
              className="absolute h-full bg-red-500/80"
              style={{
                width: `${voteCalculations.percentageAgainst}%`,
                left: `${voteCalculations.percentageFor}%`,
              }}
            ></div>

            {/* Remaining votes */}
            <div
              className="absolute h-full bg-zinc-600/50 right-0"
              style={{ width: `${voteCalculations.percentageRemaining}%` }}
            ></div>

            {/* Percentage labels - only show if there's enough space */}
            {voteCalculations.percentageFor > 10 && (
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-xs font-medium z-10">
                {voteCalculations.percentageFor.toFixed(1)}%
              </span>
            )}

            {voteCalculations.percentageAgainst > 10 && (
              <span
                className="absolute top-1/2 transform -translate-y-1/2 text-white text-xs font-medium z-10"
                style={{
                  left: `${
                    voteCalculations.percentageFor +
                    voteCalculations.percentageAgainst / 2
                  }%`,
                }}
              >
                {voteCalculations.percentageAgainst.toFixed(1)}%
              </span>
            )}
          </div>
        </>
      )}

      <div className="flex justify-between items-start">
        <div className="flex gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-500">For</span>
            </div>
            <TokenBalance
              value={parsedVotes.votesFor}
              symbol={tokenSymbol}
              decimals={8}
              variant="abbreviated"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-500">Against</span>
            </div>
            <TokenBalance
              value={parsedVotes.votesAgainst}
              symbol={tokenSymbol}
              decimals={8}
              variant="abbreviated"
            />
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-zinc-600"></div>
            <span className="text-sm text-gray-500">Total Available</span>
          </div>
          <TokenBalance
            value={liquidTokens || "0"}
            symbol={tokenSymbol}
            decimals={8}
            variant="abbreviated"
          />
        </div>
      </div>
    </div>
  );
};

export default VoteProgress;
