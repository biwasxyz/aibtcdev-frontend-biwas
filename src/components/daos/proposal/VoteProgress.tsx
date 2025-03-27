"use client";

import type React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProposalVotes } from "@/lib/vote-utils";

interface VoteProgressProps {
  votesFor?: string;
  votesAgainst?: string;
  contractAddress?: string;
  proposalId?: string | number;
}

const VoteProgress: React.FC<VoteProgressProps> = ({
  votesFor: initialVotesFor,
  votesAgainst: initialVotesAgainst,
  contractAddress,
  proposalId,
}) => {
  // Update the useQuery call to use the contract principal directly
  const { data, isLoading, error } = useQuery({
    queryKey: ["proposalVotes", contractAddress, proposalId],
    queryFn: () =>
      contractAddress && proposalId
        ? getProposalVotes(contractAddress, Number(proposalId))
        : Promise.resolve(null),
    enabled: !!contractAddress && !!proposalId,
  });

  // Clean up votes data by removing 'n' if present
  const cleanVotesValue = (value?: string) => {
    if (!value) return "0";
    return value.toString().replace(/n$/, "");
  };

  // Get votes from props or from fetched data
  const votesFor = cleanVotesValue(initialVotesFor || data?.votesFor);
  const votesAgainst = cleanVotesValue(
    initialVotesAgainst || data?.votesAgainst
  );

  // Format votes for display
  const formattedVotesFor = formatVotes(Number(votesFor) / 1e8);
  const formattedVotesAgainst = formatVotes(Number(votesAgainst) / 1e8);

  const totalVotes = Number(votesFor) + Number(votesAgainst);
  const percentageFor =
    totalVotes > 0 ? (Number(votesFor) / totalVotes) * 100 : 0;
  const percentageAgainst = 100 - percentageFor;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
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

// Helper function to format votes with appropriate suffixes
function formatVotes(votes: number): string {
  if (votes === 0) return "0";
  if (votes < 1) return votes.toFixed(2);
  if (votes < 10) return votes.toFixed(1);
  if (votes < 1000) return Math.round(votes).toString();
  if (votes < 1000000) return (votes / 1000).toFixed(1) + "K";
  return (votes / 1000000).toFixed(1) + "M";
}

export default VoteProgress;
