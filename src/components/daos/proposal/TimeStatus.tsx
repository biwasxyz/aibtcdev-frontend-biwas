"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Timer, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Proposal } from "@/types/supabase";
import { fetchBlockTimes } from "@/lib/block-time";

interface TimeStatusProps {
  createdAt: string;
  status: Proposal["status"];
  concludedBy?: string;
  start_block: number;
  end_block: number;
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

const TimeStatus: React.FC<TimeStatusProps> = ({
  status,
  concludedBy,
  start_block,
  end_block,
  createdAt,
}) => {
  const [blockTimes, setBlockTimes] = useState<{
    startBlockTime: Date | null;
    endBlockTime: Date | null;
    isEndTimeEstimated: boolean;
    isLoading: boolean;
  }>({
    startBlockTime: null,
    endBlockTime: null,
    isEndTimeEstimated: false,
    isLoading: true,
  });

  useEffect(() => {
    const loadBlockTimes = async () => {
      try {
        const { startBlockTime, endBlockTime } = await fetchBlockTimes(
          start_block,
          end_block
        );

        let startDate = startBlockTime ? new Date(startBlockTime) : null;
        let endDate = endBlockTime ? new Date(endBlockTime) : null;
        let isEndTimeEstimated = false;

        // Assuming start time will always exist as mentioned
        if (!startDate) {
          console.error("Start block time not found - this shouldn't happen");
          // Fallback in case it does happen anyway
          const now = new Date();
          const avgBlockTime =
            process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
              ? 4 * 60 * 1000 // 4 minutes for testnet
              : 10 * 60 * 1000; // 10 minutes for mainnet

          startDate = new Date(now.getTime() - avgBlockTime); // Assume recent
        }

        // Handle the case where end block hasn't been created yet
        if (startDate && !endDate) {
          // We have start time but not end time - estimate end time
          endDate = estimateBlockTime(end_block, start_block, startDate);
          isEndTimeEstimated = true;
        }

        setBlockTimes({
          startBlockTime: startDate,
          endBlockTime: endDate,
          isEndTimeEstimated,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error loading block times:", error);
        setBlockTimes({
          startBlockTime: null,
          endBlockTime: null,
          isEndTimeEstimated: false,
          isLoading: false,
        });
      }
    };

    loadBlockTimes();
  }, [start_block, end_block]);

  // Loading state
  if (blockTimes.isLoading) {
    return (
      <div className="border border-zinc-800 rounded-md p-3 w-full">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground animate-pulse" />
          <span className="text-sm">Loading block times...</span>
        </div>
      </div>
    );
  }

  const { startBlockTime, endBlockTime, isEndTimeEstimated } = blockTimes;

  // If we still don't have start time after all attempts
  if (!startBlockTime) {
    return (
      <div className="border border-zinc-800 rounded-md p-3 w-full">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Unable to determine block times</span>
        </div>
      </div>
    );
  }

  const formattedStart = format(startBlockTime, "MMM d, yyyy 'at' h:mm a");
  // Only format end time if we have it
  const formattedEnd = endBlockTime
    ? format(endBlockTime, "MMM d, yyyy 'at' h:mm a")
    : null;

  const now = new Date();
  const isEnded = endBlockTime && now.getTime() > endBlockTime.getTime();

  // For the "Voting in progress" text, we still need to consider both time and status
  const isActive =
    endBlockTime &&
    now.getTime() < endBlockTime.getTime() &&
    status !== "DEPLOYED" &&
    status !== "FAILED";

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
