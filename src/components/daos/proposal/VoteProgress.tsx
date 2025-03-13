// File: src/components/VoteProgress.tsx
"use client";
import React from "react";
import { Activity } from "lucide-react";

interface VoteProgressProps {
  votesFor: string;
  votesAgainst: string;
}

const VoteProgress: React.FC<VoteProgressProps> = ({
  votesFor,
  votesAgainst,
}) => {
  if (
    (!votesFor || votesFor.trim() === "") &&
    (!votesAgainst || votesAgainst.trim() === "")
  ) {
    return <div className="p-4 my-4">No voting data available.</div>;
  }
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
  return (
    <div className="rounded-lg border border-secondary p-4 my-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4" />
        <h4 className="font-medium text-sm">Voting Progress</h4>
      </div>
      <div className="relative h-8 w-full rounded-full bg-secondary/10 overflow-hidden">
        <div
          className="absolute left-0 h-full bg-green-500 flex items-center justify-center text-white text-xs font-bold"
          style={{ width: `${yesPercent}%` }}
        >
          {yesVotes.toFixed(2)} Yes
        </div>
        <div
          className="absolute right-0 h-full bg-red-500 flex items-center justify-center text-white text-xs font-bold"
          style={{ width: `${noPercent}%` }}
        >
          {noVotes.toFixed(2)} No
        </div>
      </div>
      <div className="text-sm text-center pt-1">
        Total: {totalVotes.toFixed(2)} votes
      </div>
    </div>
  );
};

export default VoteProgress;
