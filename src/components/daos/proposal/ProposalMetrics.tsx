"use client";

import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { useVotingStatus } from "./TimeStatus";
import { TokenBalance } from "@/components/reusables/balance-display";
import { cn } from "@/lib/utils";
import type { Proposal } from "@/types/supabase";

interface ProposalMetricsProps {
  proposal: Proposal;
}

const ProposalMetrics = ({ proposal }: ProposalMetricsProps) => {
  const { isActive, isEnded, startBlockTime } = useVotingStatus(
    proposal.status,
    proposal.start_block,
    proposal.end_block
  );

  // Check if voting has not started yet (start block not found)
  const votingNotStarted = startBlockTime === null;

  // Check if the proposal has failed
  const isFailed = isEnded && !proposal.passed;

  // Simplified metrics display
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      {/* Liquid Tokens */}
      <div className="border border-border rounded-md px-3 py-2">
        <div className="text-xs text-muted-foreground mb-1">Liquid Tokens</div>
        <div className="font-medium text-sm">
          {proposal.liquid_tokens !== null ? (
            <TokenBalance
              value={proposal.liquid_tokens.toString()}
              symbol={proposal.token_symbol || ""}
              decimals={8}
              variant="abbreviated"
            />
          ) : (
            "No data"
          )}
        </div>
      </div>

      {/* Quorum */}
      <div
        className={cn(
          "rounded-md px-3 py-2 border",
          votingNotStarted || isActive
            ? "border-blue-500/20"
            : proposal.met_quorum
            ? "border-green-500/20"
            : "border-red-500/20"
        )}
      >
        <div className="text-xs text-muted-foreground mb-1">Quorum</div>
        <div className="flex items-center text-sm">
          {votingNotStarted || isActive ? (
            <span className="font-medium text-blue-500">Pending</span>
          ) : proposal.met_quorum ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="font-medium text-green-500">Met</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="font-medium text-red-500">Not Met</span>
            </div>
          )}
        </div>
      </div>

      {/* Threshold */}
      <div
        className={cn(
          "rounded-md px-3 py-2 border",
          votingNotStarted || isActive
            ? "border-blue-500/20"
            : proposal.met_threshold
            ? "border-green-500/20"
            : "border-red-500/20"
        )}
      >
        <div className="text-xs text-muted-foreground mb-1">Threshold</div>
        <div className="flex items-center text-sm">
          {votingNotStarted || isActive ? (
            <span className="font-medium text-blue-500">Pending</span>
          ) : proposal.met_threshold ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="font-medium text-green-500">Met</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="font-medium text-red-500">Not Met</span>
            </div>
          )}
        </div>
      </div>

      {/* Outcome */}
      <div
        className={cn(
          "rounded-md px-3 py-2 border",
          votingNotStarted || isActive
            ? "border-blue-500/20"
            : proposal.passed
            ? "border-green-500/20"
            : "border-red-500/20"
        )}
      >
        <div className="text-xs text-muted-foreground mb-1">Outcome</div>
        <div className="flex items-center text-sm">
          {votingNotStarted || isActive ? (
            <span className="font-medium text-blue-500">Pending</span>
          ) : proposal.passed ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="font-medium text-green-500">Passed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="font-medium text-red-500">Failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Execution Status */}
      <div
        className={cn(
          "rounded-md px-3 py-2 border",
          votingNotStarted || isActive
            ? "border-blue-500/20"
            : isFailed
            ? "border-red-500/20"
            : proposal.executed === true
            ? "border-green-500/20"
            : "border-amber-500/20"
        )}
      >
        <div className="text-xs text-muted-foreground mb-1">Execution</div>
        <div className="flex items-center text-sm">
          {votingNotStarted || isActive ? (
            <span className="font-medium text-blue-500">Pending</span>
          ) : isFailed ? (
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="font-medium text-red-500">Failed</span>
            </div>
          ) : proposal.executed === true ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="font-medium text-green-500">Executed</span>
            </div>
          ) : proposal.executed === false ? (
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="font-medium text-red-500">Not Executed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-medium text-amber-500">Pending</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalMetrics;
