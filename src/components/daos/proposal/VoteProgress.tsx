"use client";
import type React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProposalVotes } from "@/lib/vote-utils";

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
  // Use React Query to fetch votes data if not provided directly
  const { data, isLoading, error } = useQuery({
    queryKey: ["proposalVotes", contractAddress, proposalId],
    queryFn: () => getProposalVotes(contractAddress!, Number(proposalId)),
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

  // Use formatted votes from API if available
  const formattedVotesFor = data?.formattedVotesFor;
  const formattedVotesAgainst = data?.formattedVotesAgainst;

  // Check if voting data is available
  if (isLoading) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground py-4">
        <div className="animate-spin h-5 w-5 border-2 border-green-500 rounded-full border-t-transparent mr-2"></div>
        Loading voting data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-sm text-red-500 py-4">
        Error loading voting data
      </div>
    );
  }

  if (
    (!votesFor || votesFor.trim() === "") &&
    (!votesAgainst || votesAgainst.trim() === "")
  ) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground py-4">
        No voting data available
      </div>
    );
  }

  // Calculate vote counts and percentages
  const yesVotes = (Number.parseFloat(votesFor) || 0) / 1e8;
  const noVotes = (Number.parseFloat(votesAgainst) || 0) / 1e8;
  const totalVotes = yesVotes + noVotes;

  // Check if there are 0 votes
  if (totalVotes === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground py-4">
        Awaiting first vote from agent.
      </div>
    );
  }

  let yesPercent = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 50;
  let noPercent = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 50;
  const minDisplay = 5;
  if (yesVotes > 0 && yesPercent < minDisplay) yesPercent = minDisplay;
  if (noVotes > 0 && noPercent < minDisplay) noPercent = minDisplay;
  const sum = yesPercent + noPercent;
  if (sum > 100) {
    const factor = 100 / sum;
    yesPercent *= factor;
    noPercent *= factor;
  }

  // Format vote numbers with appropriate suffixes for better readability
  const formatVotes = (votes: number): string => {
    if (votes === 0) return "0";
    if (votes < 1) return votes.toFixed(2);
    if (votes < 10) return votes.toFixed(1);
    if (votes < 1000) return Math.round(votes).toString();
    if (votes < 1000000) return (votes / 1000).toFixed(1) + "K";
    return (votes / 1000000).toFixed(1) + "M";
  };

  // Use pre-formatted votes if available, otherwise format them here
  const displayYesVotes = formattedVotesFor || formatVotes(yesVotes);
  const displayNoVotes = formattedVotesAgainst || formatVotes(noVotes);

  return (
    <div>
      {/* Vote counts above the progress bar */}
      <div className="flex justify-between mb-2">
        <div className="flex items-center">
          <ThumbsUp className="h-4 w-4 text-green-500 mr-1.5" />
          <span className="text-sm font-medium">{displayYesVotes}</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm font-medium">{displayNoVotes}</span>
          <ThumbsDown className="h-4 w-4 text-red-500 ml-1.5" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-8 sm:h-10 w-full rounded-md bg-zinc-800 overflow-hidden">
        <div
          className="absolute left-0 h-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-start text-white text-xs sm:text-sm font-medium px-2"
          style={{ width: `${yesPercent}%` }}
        >
          {yesPercent >= 15 && `${yesPercent.toFixed(1)}%`}
        </div>
        <div
          className="absolute right-0 h-full bg-gradient-to-l from-red-600 to-red-500 flex items-center justify-end text-white text-xs sm:text-sm font-medium px-2"
          style={{ width: `${noPercent}%` }}
        >
          {noPercent >= 15 && `${noPercent.toFixed(1)}%`}
        </div>
      </div>

      {/* Details row under the progress bar */}
      <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
        <div>
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          Yes
        </div>
        <div className="text-center">
          Total: {formatVotes(totalVotes)} token{totalVotes !== 1 ? "s" : ""}
        </div>
        <div>
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
          No
        </div>
      </div>
    </div>
  );
};

export default VoteProgress;
