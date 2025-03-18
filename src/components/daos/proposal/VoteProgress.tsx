"use client";
import React from "react";
import { Activity, ThumbsUp, ThumbsDown } from "lucide-react";

interface VoteProgressProps {
  votesFor: string;
  votesAgainst: string;
}

const VoteProgress: React.FC<VoteProgressProps> = ({
  votesFor,
  votesAgainst,
}) => {
  // Check if voting data is available
  if (
    (!votesFor || votesFor.trim() === "") &&
    (!votesAgainst || votesAgainst.trim() === "")
  ) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground">
        <Activity className="h-4 w-4 mr-2" />
        No voting data available
      </div>
    );
  }

  // Calculate vote counts and percentages
  const yesVotes = (Number.parseFloat(votesFor) || 0) / 1e8;
  const noVotes = (Number.parseFloat(votesAgainst) || 0) / 1e8;
  const totalVotes = yesVotes + noVotes;
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

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-5 w-5 text-green-500" />
        <h4 className="font-medium text-base">Voting Progress</h4>
      </div>

      {/* Vote counts above the progress bar */}
      <div className="flex justify-between mb-2">
        <div className="flex items-center">
          <ThumbsUp className="h-4 w-4 text-green-500 mr-1.5" />
          <span className="text-sm font-medium">{formatVotes(yesVotes)}</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm font-medium">{formatVotes(noVotes)}</span>
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
