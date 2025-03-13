"use client";
import React from "react";
import { Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import useBlockTime from "@/hooks/use-block-time";
import { Proposal } from "@/types/supabase";
import { truncateString } from "./helper";

interface TimeStatusProps {
  createdAt: string;
  status: Proposal["status"];
  concludedBy?: string;
  start_block: number;
  end_block: number;
}

const TimeStatus: React.FC<TimeStatusProps> = ({
  status,
  concludedBy,
  start_block,
  end_block,
}) => {
  const startBlockTime = useBlockTime(start_block);
  const endBlockTime = useBlockTime(
    end_block,
    startBlockTime
      ? { referenceTime: startBlockTime, referenceBlock: start_block }
      : undefined
  );
  const now = new Date();

  if (!startBlockTime || !endBlockTime) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Timer className="h-4 w-4" />
        <span className="text-sm">Loading block times...</span>
      </div>
    );
  }

  const formattedStart = format(startBlockTime, "MMM d, yyyy 'at' h:mm a");
  const formattedEnd = format(endBlockTime, "MMM d, yyyy 'at' h:mm a");

  const isActive =
    now.getTime() < endBlockTime.getTime() &&
    status !== "DEPLOYED" &&
    status !== "FAILED";

  return (
    <div className="bg-zinc-900 p-4 rounded-md shadow-md mx-auto w-full md:max-w-md mt-2">
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
      <div className="text-sm mt-1">{`Started: ${formattedStart}`}</div>
      <div className="text-sm mt-1"> {` Ends: ${formattedEnd}`}</div>

      {concludedBy && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm">
            Concluded by: {truncateString(concludedBy, 6, 4)}
          </span>
        </div>
      )}
    </div>
  );
};

export default TimeStatus;
