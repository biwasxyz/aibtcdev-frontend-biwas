"use client";
import type React from "react";

import { useQuery } from "@tanstack/react-query";
import { getProposalVotes, formatVotes } from "@/lib/vote-utils";

interface VoteProgressProps {
  contractAddress?: string;
  proposalId?: string;
  votesFor?: string;
  votesAgainst?: string;
}

const VoteProgress: React.FC<VoteProgressProps> = ({
  contractAddress,
  proposalId,
  votesFor: initialVotesFor,
  votesAgainst: initialVotesAgainst,
}) => {
  // Update the useQuery call to use the contract principal directly
  const { data, isLoading, error } = useQuery({
    queryKey: ["proposalVotes", contractAddress, proposalId],
    queryFn: ({ meta }) => {
      // Use the bustCache flag from query meta if available
      const bustCache = meta?.bustCache === true;
      return getProposalVotes(contractAddress!, Number(proposalId), bustCache);
    },
    // Only fetch if we have contractAddress and proposalId but no direct votes data
    enabled:
      !!contractAddress &&
      !!proposalId &&
      !initialVotesFor &&
      !initialVotesAgainst,
    // Keep cached data for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Don't refetch on window focus for this data
    refetchOnWindowFocus: false,
  });

  // Determine which votes data to use
  const votesFor = initialVotesFor || data?.votesFor || "0";
  const votesAgainst = initialVotesAgainst || data?.votesAgainst || "0";

  // Use the formatted votes for display
  const formattedVotesFor =
    data?.formattedVotesFor || formatVotes(Number(votesFor) / 1e8);
  const formattedVotesAgainst =
    data?.formattedVotesAgainst || formatVotes(Number(votesAgainst) / 1e8);

  const totalVotes = Number(votesFor) + Number(votesAgainst);
  const percentageFor =
    totalVotes > 0 ? (Number(votesFor) / totalVotes) * 100 : 0;
  const percentageAgainst = 100 - percentageFor;

  if (isLoading) {
    return <div className="h-4 bg-zinc-800 rounded-full animate-pulse"></div>;
  }

  if (error) {
    return (
      <div className="text-red-500">Error: {(error as Error).message}</div>
    );
  }

  return (
    <div className="space-y-4">
      {Number(votesFor) === 0 && Number(votesAgainst) === 0 ? (
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
          <span className="font-medium">{formattedVotesFor}</span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-sm text-gray-500">Against</span>
          <span className="font-medium">{formattedVotesAgainst}</span>
        </div>
      </div>
    </div>
  );
};

export default VoteProgress;
