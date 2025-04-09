"use client";

import type React from "react";
import { useMemo } from "react";
import { Timer, Calendar, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Proposal } from "@/types/supabase";
import { useQuery } from "@tanstack/react-query";

// Props interface for the component
interface TimeStatusProps {
  createdAt: string;
  status: Proposal["status"];
  concludedBy?: string;
  start_block: number;
  end_block: number;
}

// Return interface for the hook
export interface VotingStatusInfo {
  isActive: boolean;
  isEnded: boolean;
  endBlockTime: Date | null;
  startBlockTime: Date | null;
  isEndTimeEstimated: boolean;
  isLoading: boolean;
}

// Helper function: estimateBlockTime
const estimateBlockTime = (
  blockHeight: number,
  referenceBlock: number,
  referenceTime: Date
): Date => {
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK || "mainnet";
  const avgBlockTimeMs = network === "testnet" ? 4 * 60 * 1000 : 10 * 60 * 1000;

  const blockDiff = blockHeight - referenceBlock;
  // Handle cases where end block might be before start block (shouldn't happen)
  if (blockDiff < 0) {
    console.warn(
      `End block ${blockHeight} is before start block ${referenceBlock}. Estimation might be inaccurate.`
    );
  }
  return new Date(referenceTime.getTime() + blockDiff * avgBlockTimeMs);
};

// Helper function: fetchBlockTimes
const fetchBlockTimes = async (
  startBlock: number,
  endBlock: number
): Promise<{ startBlockTime: string | null; endBlockTime: string | null }> => {
  // Construct the URL safely
  const params = new URLSearchParams({
    startBlock: startBlock.toString(),
    endBlock: endBlock.toString(),
  });
  const apiUrl = `/block-times?${params.toString()}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(
        `Failed to fetch block times (${apiUrl}): ${response.status} ${response.statusText}`
      );
      // Throw error to be caught by React Query
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (
      typeof data !== "object" ||
      data === null ||
      !("startBlockTime" in data) ||
      !("endBlockTime" in data)
    ) {
      console.error(
        "Invalid data structure received from /block-times API:",
        data
      );
      throw new Error("Invalid data structure received from API");
    }
    return data as {
      startBlockTime: string | null;
      endBlockTime: string | null;
    };
  } catch (error) {
    console.error(`Network or parsing error fetching ${apiUrl}:`, error);
    // Re-throw the error so React Query can handle it
    throw error;
  }
};

// --- Refactored useVotingStatus Hook ---
export const useVotingStatus = (
  status: Proposal["status"],
  start_block: number,
  end_block: number
): VotingStatusInfo => {
  const { data, isLoading, error, isError } = useQuery({
    // Destructure isError as well
    queryKey: ["blockTimes", start_block, end_block],
    queryFn: () => fetchBlockTimes(start_block, end_block),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 1,

    enabled:
      typeof start_block === "number" &&
      typeof end_block === "number" &&
      start_block > 0 &&
      end_block > 0,
  });

  // 2. Derive voting status using useMemo based on query results and props
  const votingStatusInfo = useMemo((): VotingStatusInfo => {
    // Handle Loading State
    if (isLoading) {
      return {
        startBlockTime: null,
        endBlockTime: null,
        isEndTimeEstimated: false,
        isLoading: true, // Currently loading
        isActive: false,
        isEnded: false,
      };
    }

    if (isError || !data) {
      console.error(
        "Error state or no data after loading for blocks:",
        start_block,
        end_block,
        error
      );
      return {
        startBlockTime: null,
        endBlockTime: null,
        isEndTimeEstimated: false,
        isLoading: false, // No longer loading
        isActive: false,
        isEnded: false, // Considered not ended due to error
      };
    }

    const {
      startBlockTime: startBlockTimeString,
      endBlockTime: endBlockTimeString,
    } = data;

    const startDate = startBlockTimeString
      ? new Date(startBlockTimeString)
      : null;
    let endDate = endBlockTimeString ? new Date(endBlockTimeString) : null;
    let isEndTimeEstimated = false;

    // Handle specific case: Start date is null IN THE DATA after successful fetch
    if (!startDate) {
      console.warn(
        "Start block time not found in data for start_block:",
        start_block
      );
      return {
        startBlockTime: null, // Explicitly null
        endBlockTime: null,
        isEndTimeEstimated: false,
        isLoading: false, // No longer loading
        isActive: false,
        isEnded: false,
      };
    }

    // Estimate end time if start exists but end doesn't
    // Ensure end_block is valid for estimation
    if (
      startDate &&
      !endDate &&
      typeof end_block === "number" &&
      end_block > start_block
    ) {
      endDate = estimateBlockTime(end_block, start_block, startDate);
      isEndTimeEstimated = true;
    }

    // Calculate current status based on available/estimated dates
    const now = new Date();
    // Ensure endDate is a valid Date object for reliable comparisons
    const isEnded =
      endDate instanceof Date && now.getTime() >= endDate.getTime();
    // Ensure proposal status 'FAILED' prevents 'isActive' being true
    // Also ensure start date has passed
    const isActive =
      startDate instanceof Date &&
      endDate instanceof Date &&
      now.getTime() >= startDate.getTime() &&
      now.getTime() < endDate.getTime() &&
      status !== "FAILED"; // Example status check

    // Return the calculated status object
    return {
      startBlockTime: startDate,
      endBlockTime: endDate, // Will be Date object or null
      isEndTimeEstimated,
      isLoading: false, // Data processed
      isActive,
      isEnded,
    };
    // Dependencies for useMemo: Recalculate if query results or inputs change
  }, [data, isLoading, error, isError, status, start_block, end_block]); // Added isError dependency

  // 3. Return the derived state object
  return votingStatusInfo;
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

  // 2. Handle SPECIFIC case: Start time is null AFTER loading (API returned null or error occurred)
  if (startBlockTime === null) {
    return (
      <div className="border border-amber-700/50 rounded-md p-3 w-full bg-amber-900/10">
        <div className="flex items-center gap-2 text-amber-500">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Start Time Unavailable</span>
        </div>
        <p className="text-xs text-amber-600/90 mt-2">
          The timestamp for the starting block (#{start_block}) could not be
          retrieved from the API. The voting period cannot be accurately
          determined yet.
        </p>
      </div>
    );
  }

  const formattedStart = format(startBlockTime, "MMM d, yyyy 'at' h:mm a");
  const formattedEnd =
    endBlockTime instanceof Date
      ? format(endBlockTime, "MMM d, yyyy 'at' h:mm a")
      : null;

  return (
    <div className="border border-zinc-800 rounded-md p-3 w-full">
      {/* Header (Active/Ended status) */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          {isActive ? (
            <span className="text-sm font-medium text-blue-500">
              Voting in progress
            </span>
          ) : (
            <span className="text-sm font-medium">
              {isEnded ? "Voting Period" : "Voting Starts Soon"}
            </span>
          )}
        </div>
        {isEnded && (
          <Badge variant="outline" className="text-xs bg-zinc-800/50">
            Ended
          </Badge>
        )}
      </div>

      {/* Start/End Time Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Start Time */}
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">Started</div>
            <div className="text-sm">{formattedStart}</div>
          </div>
        </div>

        {/* End Time */}
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">Ends</div>
            <div className="text-sm">
              {formattedEnd ? (
                <span
                  className={`flex items-center flex-wrap gap-1 ${
                    isEndTimeEstimated ? "" : ""
                  }`}
                >
                  {formattedEnd}
                  {isEndTimeEstimated && (
                    <Badge
                      variant="outline"
                      className="text-xs font-normal bg-zinc-800/50 ml-1"
                    >
                      Estimated
                    </Badge>
                  )}
                </span>
              ) : (
                // Provide clearer fallback if end date couldn't be determined/estimated
                <span className="text-muted-foreground">
                  {end_block ? `After Block #${end_block}` : "Not determinable"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estimation Notice (only if estimated) */}
      {isEndTimeEstimated && (
        <div className="mt-3 text-xs text-muted-foreground">
          End block #{end_block} time is estimated based on average block time.
        </div>
      )}
    </div>
  );
};

export default TimeStatus;
