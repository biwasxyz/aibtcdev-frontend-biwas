"use client";
import type React from "react";
import type { Proposal } from "@/types/supabase";
import { CheckCircle2, XCircle } from "lucide-react";

interface ProposalMetricsProps {
  proposal: Proposal;
}

const ProposalMetrics: React.FC<ProposalMetricsProps> = ({ proposal }) => {
  const formatNumber = (num: number): string => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const liquidTokens =
    proposal.liquid_tokens !== null
      ? formatNumber(proposal.liquid_tokens / 1e8)
      : "No data available";

  return (
    <div className="p-3 sm:p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
      <h4 className="text-sm font-medium mb-3">Proposal Metrics</h4>

      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        {/* Liquid Tokens */}
        <div className="space-y-1">
          <div className="text-md font-bold text-muted-foreground">
            Liquid Tokens
          </div>
          <div className="text-xs text-muted-foreground">
            Tokens available for trading and voting.
          </div>
          <div className="font-medium text-sm">{liquidTokens}</div>
        </div>

        {/* Quorum */}
        <div className="space-y-1">
          <div className="text-md font-bold text-muted-foreground">Quorum</div>
          <div className="text-xs text-muted-foreground">
            The minimum number of votes needed for a valid decision.
          </div>
          <div className="flex items-center">
            {proposal.met_quorum ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-1.5" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 mr-1.5" />
            )}
            <span className="font-medium text-sm">
              {proposal.met_quorum ? "Met" : "Not Met"}
            </span>
          </div>
        </div>

        {/* Threshold */}
        <div className="space-y-1">
          <div className="text-md font-bold text-muted-foreground">
            Threshold
          </div>
          <div className="text-xs text-muted-foreground">
            The required percentage of &apos;Yes&apos; votes required to pass
            the proposal.
          </div>
          <div className="flex items-center">
            {proposal.met_threshold ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-1.5" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 mr-1.5" />
            )}
            <span className="font-medium text-sm">
              {proposal.met_threshold ? "Met" : "Not Met"}
            </span>
          </div>
        </div>

        {/* Outcome */}
        <div className="space-y-1">
          <div className="text-md font-bold text-muted-foreground">Outcome</div>
          <div className="text-xs text-muted-foreground">
            Shows if the proposal passed or failed.
          </div>
          <div className="flex items-center">
            {proposal.passed ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-1.5" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 mr-1.5" />
            )}
            <span className="font-medium text-sm">
              {proposal.passed ? "Passed" : "Failed"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalMetrics;
