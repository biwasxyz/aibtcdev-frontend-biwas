"use client";

import type React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProposalVotes } from "@/lib/vote-utils";
import { useMemo, useState, useEffect } from "react";

interface VoteProgressProps {
  votesFor?: string;
  votesAgainst?: string;
  contractAddress?: string;
  proposalId?: string | number;
  refreshing?: boolean;
}

const VoteProgress: React.FC<VoteProgressProps> = ({
  votesFor: initialVotesFor,
  votesAgainst: initialVotesAgainst,
  contractAddress,
  proposalId,
  refreshing = false,
}) => {
  // Memoize initial votes parsing
  const initialParsedVotes = useMemo(() => {
    const parsedFor = initialVotesFor ? initialVotesFor.replace(/n$/, "") : "0";
    const parsedAgainst = initialVotesAgainst
      ? initialVotesAgainst.replace(/n$/, "")
      : "0";

    const votesForNum = !isNaN(Number(parsedFor)) ? Number(parsedFor) : 0;
    const votesAgainstNum = !isNaN(Number(parsedAgainst))
      ? Number(parsedAgainst)
      : 0;

    return {
      votesFor: parsedFor,
      votesAgainst: parsedAgainst,
      formattedVotesFor: (votesForNum / 1e8).toString(),
      formattedVotesAgainst: (votesAgainstNum / 1e8).toString(),
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

    const percentageFor = totalVotes > 0 ? (votesForNum / totalVotes) * 100 : 0;
    const percentageAgainst = 100 - percentageFor;

    return {
      votesForNum,
      votesAgainstNum,
      percentageFor,
      percentageAgainst,
      totalVotes,
    };
  }, [parsedVotes]);

  // Update parsed votes when data changes
  useEffect(() => {
    if (data) {
      setParsedVotes({
        votesFor: data.votesFor || "0",
        votesAgainst: data.votesAgainst || "0",
        formattedVotesFor: data.formattedVotesFor || "0",
        formattedVotesAgainst: data.formattedVotesAgainst || "0",
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
      {voteCalculations.votesForNum === 0 &&
      voteCalculations.votesAgainstNum === 0 ? (
        <div className="py-4 text-center bg-zinc-800 rounded-lg">
          Awaiting first vote from agent
        </div>
      ) : (
        <>
          <div className="relative h-6 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-green-500 rounded-l-full"
              style={{ width: `${voteCalculations.percentageFor}%` }}
            ></div>
            <div
              className="absolute h-full bg-red-500 rounded-r-full right-0"
              style={{ width: `${voteCalculations.percentageAgainst}%` }}
            ></div>

            {/* Percentage labels */}
            {voteCalculations.percentageFor > 10 && (
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-xs font-medium">
                {voteCalculations.percentageFor.toFixed(1)}%
              </span>
            )}

            {voteCalculations.percentageAgainst > 10 && (
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-xs font-medium">
                {voteCalculations.percentageAgainst.toFixed(1)}%
              </span>
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">For</span>
          <span className="font-medium">{parsedVotes.formattedVotesFor}</span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-sm text-gray-500">Against</span>
          <span className="font-medium">
            {parsedVotes.formattedVotesAgainst}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoteProgress;
