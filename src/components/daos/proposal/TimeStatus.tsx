"use client";
import React from "react";
import { Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Proposal } from "@/types/supabase";
import { truncateString } from "./helper";
import { useQueries } from "@tanstack/react-query";

interface TimeStatusProps {
  createdAt: string;
  status: Proposal["status"];
  concludedBy?: string;
  start_block: number;
  end_block: number;
}

// Function to fetch block time
const fetchBlockTime = async (blockHeight: number) => {
  const baseURL =
    process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
      ? "https://api.testnet.hiro.so"
      : "https://api.hiro.so";

  const response = await fetch(
    `${baseURL}/extended/v2/burn-blocks/${blockHeight}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch block time for block ${blockHeight}`);
  }

  const data = await response.json();
  return data.burn_block_time_iso ? new Date(data.burn_block_time_iso) : null;
};

// Function to estimate block time if API call fails
const estimateBlockTime = (
  blockHeight: number,
  referenceBlock: number,
  referenceTime: Date
) => {
  const avgBlockTime =
    process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
      ? 4 * 60 * 1000 // 4 minutes for testnet
      : 12 * 60 * 1000; // 12 minutes for mainnet

  const blockDiff = blockHeight - referenceBlock;
  return new Date(referenceTime.getTime() + blockDiff * avgBlockTime);
};

const TimeStatus: React.FC<TimeStatusProps> = ({
  status,
  concludedBy,
  start_block,
  end_block,
}) => {
  // 12 minutes in milliseconds
  const TWELVE_MINUTES_MS = 12 * 60 * 1000;

  // Using TanStack Query to fetch both block times
  const results = useQueries({
    queries: [
      {
        queryKey: ["blockTime", start_block],
        queryFn: () => fetchBlockTime(start_block),
        retry: 2,
        staleTime: TWELVE_MINUTES_MS, // 12 minutes stale time
      },
      {
        queryKey: ["blockTime", end_block],
        queryFn: () => fetchBlockTime(end_block),
        retry: 2,
        staleTime: TWELVE_MINUTES_MS, // 12 minutes stale time
        enabled: true, // Always enabled, we'll handle the fallback in the component
      },
    ],
  });

  const [startBlockQuery, endBlockQuery] = results;

  // Loading state
  if (startBlockQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Timer className="h-4 w-4" />
        <span className="text-sm">Loading block times...</span>
      </div>
    );
  }

  // Error handling for start block
  if (startBlockQuery.isError) {
    return (
      <div className="flex items-center gap-2 mt-2 text-red-500">
        <Timer className="h-4 w-4" />
        <span className="text-sm">Error loading start block time</span>
      </div>
    );
  }

  const startBlockTime = startBlockQuery.data;

  // Handle end block time (either from query or estimate)
  let endBlockTime: Date | null = null;

  if (endBlockQuery.data) {
    endBlockTime = endBlockQuery.data;
  } else if (startBlockTime && endBlockQuery.isError) {
    // Fallback to estimation if API call fails
    endBlockTime = estimateBlockTime(end_block, start_block, startBlockTime);
  }

  // If we still don't have end block time after fallback
  if (!startBlockTime || !endBlockTime) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Timer className="h-4 w-4" />
        <span className="text-sm">Unable to determine block times</span>
      </div>
    );
  }

  const formattedStart = format(startBlockTime, "MMM d, yyyy 'at' h:mm a");
  const formattedEnd = format(endBlockTime, "MMM d, yyyy 'at' h:mm a");

  const now = new Date();
  const isActive =
    now.getTime() < endBlockTime.getTime() &&
    status !== "DEPLOYED" &&
    status !== "FAILED";

  return (
    <div className="border border-secondary rounded-md p-3 sm:p-4 w-full mt-2">
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4" />
        {isActive ? (
          <span className="text-sm font-medium text-primary">
            Voting in progress
          </span>
        ) : (
          <span className="text-sm font-medium">Voting period</span>
        )}
        {!isActive && (
          <Badge variant="destructive" className="text-xs ml-2">
            Ended
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2">
        <div className="text-xs sm:text-sm">
          <span className="text-muted-foreground">Started:</span>{" "}
          {formattedStart}
        </div>
        <div className="text-xs sm:text-sm">
          <span className="text-muted-foreground">Ends:</span> {formattedEnd}
        </div>
      </div>

      {concludedBy && (
        <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm">
          <span className="text-muted-foreground">Concluded by:</span>
          <code className="bg-secondary/20 px-1 py-0.5 rounded text-xs">
            {truncateString(concludedBy, 6, 4)}
          </code>
        </div>
      )}
    </div>
  );
};

export default TimeStatus;
