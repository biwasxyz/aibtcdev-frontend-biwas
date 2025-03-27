"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Timer, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Proposal } from "@/types/supabase";
import { useQuery } from "@tanstack/react-query";

interface TimeStatusProps {
  createdAt: string;
  status: Proposal["status"];
  concludedBy?: string;
  start_block: number;
  end_block: number;
}

export interface VotingStatusInfo {
  isActive: boolean;
  isEnded: boolean;
  endBlockTime: Date | null;
  startBlockTime: Date | null;
  isEndTimeEstimated: boolean;
  isLoading: boolean;
}

// Function to estimate block time if API data is not available
const estimateBlockTime = (
  blockHeight: number,
  referenceBlock: number,
  referenceTime: Date
) => {
  const avgBlockTime =
    process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
      ? 4 * 60 * 1000 // 4 minutes for testnet
      : 10 * 60 * 1000; // 10 minutes for mainnet

  const blockDiff = blockHeight - referenceBlock;
  return new Date(referenceTime.getTime() + blockDiff * avgBlockTime);
};

// Function to fetch block times from the Next.js API route
const fetchBlockTimes = async (startBlock: number, endBlock: number) => {
  const response = await fetch(
    `/block-times?startBlock=${startBlock}&endBlock=${endBlock}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch block times");
  }

  return response.json();
};

export const useVotingStatus = (
  status: Proposal["status"],
  start_block: number,
  end_block: number
): VotingStatusInfo => {
  const [votingStatus, setVotingStatus] = useState<VotingStatusInfo>({
    startBlockTime: null,
    endBlockTime: null,
    isEndTimeEstimated: false,
    isLoading: true,
    isActive: false,
    isEnded: false,
  });

  // Use Tanstack Query to fetch and cache block times
  const { data, isLoading, error } = useQuery({
    queryKey: ["blockTimes", start_block, end_block],
    queryFn: () => fetchBlockTimes(start_block, end_block),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 60, // Keep cached data for 1 hour
  });

  useEffect(() => {
    if (isLoading) return;

    if (error) {
      console.error("Error loading block times:", error);
      setVotingStatus((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    if (data) {
      const { startBlockTime, endBlockTime } = data;

      const startDate = startBlockTime ? new Date(startBlockTime) : null;
      let endDate = endBlockTime ? new Date(endBlockTime) : null;
      let isEndTimeEstimated = false;

      if (!startDate) {
        console.error("Start block time not found");
        setVotingStatus({
          startBlockTime: null,
          endBlockTime: null,
          isEndTimeEstimated: false,
          isLoading: false,
          isActive: false,
          isEnded: false,
        });
        return;
      }

      // Handle the case where end block hasn't been created yet
      if (startDate && !endDate) {
        // We have start time but not end time - estimate end time
        endDate = estimateBlockTime(end_block, start_block, startDate);
        isEndTimeEstimated = true;
      }

      const now = new Date();
      // Make sure these are always boolean values
      const isEnded = Boolean(endDate && now.getTime() > endDate.getTime());
      const isActive = Boolean(
        endDate && now.getTime() < endDate.getTime() && status !== "FAILED"
      );

      setVotingStatus({
        startBlockTime: startDate,
        endBlockTime: endDate,
        isEndTimeEstimated,
        isLoading: false,
        isActive,
        isEnded,
      });
    }
  }, [data, isLoading, error, start_block, end_block, status]);

  return votingStatus;
};

const TimeStatus: React.FC<TimeStatusProps> = ({
  status,
  start_block,
  end_block,
}) => {
  const {
    startBlockTime,
    endBlockTime,
    isEndTimeEstimated,
    isLoading,
    isActive,
    isEnded,
  } = useVotingStatus(status, start_block, end_block);

  // Loading state
  if (isLoading) {
    return (
      <div className="border border-zinc-800 rounded-md p-3 w-full">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground animate-pulse" />
          <span className="text-sm">Loading block times...</span>
        </div>
      </div>
    );
  }

  // If we still don't have start time after all attempts
  if (!startBlockTime) {
    return (
      <div className="border border-zinc-800 rounded-md p-3 w-full">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Voting not started yet</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          The voting period will begin once the start block is created on the
          blockchain.
        </p>
      </div>
    );
  }

  const formattedStart = format(startBlockTime, "MMM d, yyyy 'at' h:mm a");
  // Only format end time if we have it
  const formattedEnd = endBlockTime
    ? format(endBlockTime, "MMM d, yyyy 'at' h:mm a")
    : null;

  return (
    <div className="border border-zinc-800 rounded-md p-3 w-full">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="h-4 w-4 text-muted-foreground" />
        {isActive ? (
          <span className="text-sm font-medium text-blue-500">
            Voting in progress
          </span>
        ) : (
          <span className="text-sm font-medium">Voting period</span>
        )}
        {isEnded && (
          <Badge variant="outline" className="text-xs ml-2 bg-zinc-800/50">
            Ended
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <div className="text-xs text-muted-foreground">Started</div>
            <div className="text-sm">{formattedStart}</div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <div className="text-xs text-muted-foreground">Ends</div>
            <div className="text-sm">
              {isEndTimeEstimated ? (
                <span className="flex items-center flex-wrap gap-1">
                  {formattedEnd}
                  <Badge
                    variant="outline"
                    className="text-xs font-normal bg-zinc-800/50"
                  >
                    Estimated
                  </Badge>
                </span>
              ) : (
                formattedEnd || "Block not created yet"
              )}
            </div>
          </div>
        </div>
      </div>

      {isEndTimeEstimated && (
        <div className="mt-3 text-xs text-muted-foreground">
          End block #{end_block} has not been created yet. Time is estimated
          based on average block time.
        </div>
      )}
    </div>
  );
};

export default TimeStatus;
