"use client";

import type React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProposalVotes } from "@/lib/vote-utils";
import { useState, useEffect } from "react";

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
  // State to store parsed vote values
  const [parsedVotes, setParsedVotes] = useState({
    votesFor: "0",
    votesAgainst: "0",
    formattedVotesFor: "0",
    formattedVotesAgainst: "0",
  });

  // Update the useQuery call to use the contract principal directly
  // and always use cache busting when refreshing
  const { data, isLoading, error } = useQuery({
    queryKey: ["proposalVotes", contractAddress, proposalId, refreshing],
    queryFn: async () => {
      if (contractAddress && proposalId) {
        // Always use cache busting when the refreshing prop is true
        return getProposalVotes(
          contractAddress,
          Number(proposalId),
          refreshing
        );
      }
      return null;
    },
    enabled: !!contractAddress && !!proposalId,
    refetchOnWindowFocus: false, // Disable refetching when window regains focus
  });

  // Process initial votes or data from the query
  useEffect(() => {
    // Parse initial votes if provided
    if (initialVotesFor || initialVotesAgainst) {
      const parsedFor = initialVotesFor
        ? initialVotesFor.replace(/n$/, "")
        : "0";
      const parsedAgainst = initialVotesAgainst
        ? initialVotesAgainst.replace(/n$/, "")
        : "0";

      // Convert to numbers for calculations, defaulting to 0 if invalid
      const votesForNum = !isNaN(Number(parsedFor)) ? Number(parsedFor) : 0;
      const votesAgainstNum = !isNaN(Number(parsedAgainst))
        ? Number(parsedAgainst)
        : 0;

      setParsedVotes({
        votesFor: parsedFor,
        votesAgainst: parsedAgainst,
        formattedVotesFor: (votesForNum / 1e8).toString(),
        formattedVotesAgainst: (votesAgainstNum / 1e8).toString(),
      });
    }
    // Otherwise use data from the query
    else if (data) {
      setParsedVotes({
        votesFor: data.votesFor || "0",
        votesAgainst: data.votesAgainst || "0",
        formattedVotesFor: data.formattedVotesFor || "0",
        formattedVotesAgainst: data.formattedVotesAgainst || "0",
      });
    }
  }, [initialVotesFor, initialVotesAgainst, data]);

  // Calculate percentages
  const votesForNum = Number(parsedVotes.votesFor) || 0;
  const votesAgainstNum = Number(parsedVotes.votesAgainst) || 0;
  const totalVotes = votesForNum + votesAgainstNum;

  const percentageFor = totalVotes > 0 ? (votesForNum / totalVotes) * 100 : 0;
  const percentageAgainst = 100 - percentageFor;

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
      {votesForNum === 0 && votesAgainstNum === 0 ? (
        <div className="py-4 text-center bg-zinc-800 rounded-lg">
          Awaiting first vote from agent
        </div>
      ) : (
        <>
          <div className="relative h-6 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-green-500 rounded-l-full"
              style={{ width: `${percentageFor}%` }}
            ></div>
            <div
              className="absolute h-full bg-red-500 rounded-r-full right-0"
              style={{ width: `${percentageAgainst}%` }}
            ></div>

            {/* Percentage labels */}
            {percentageFor > 10 && (
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-xs font-medium">
                {percentageFor.toFixed(1)}%
              </span>
            )}

            {percentageAgainst > 10 && (
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-xs font-medium">
                {percentageAgainst.toFixed(1)}%
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
