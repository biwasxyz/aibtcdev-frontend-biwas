"use client";
import type React from "react";
import type { Proposal } from "@/types/supabase";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProposalMetricsProps {
  proposal: Proposal;
}

const ProposalMetrics: React.FC<ProposalMetricsProps> = ({ proposal }) => {
  const liquidTokens =
    proposal.liquid_tokens !== null
      ? (proposal.liquid_tokens / 1e8).toFixed(2)
      : "No data available";

  return (
    <TooltipProvider>
      <div className="p-3 sm:p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <span>Proposal Metrics</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Key metrics for this proposal</p>
            </TooltipContent>
          </Tooltip>
        </h4>

        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              Liquid Tokens
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Total number of tokens currently in circulation that are not
                    locked or staked and are available for transactions or
                    voting.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="font-medium text-sm">{liquidTokens}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              Quorum
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Minimum percentage of total voting power that must
                    participate for the vote to be valid.
                  </p>
                </TooltipContent>
              </Tooltip>
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

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              Threshold
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Minimum proportion of 'Yes' votes required, excluding
                    'Abstain' votes, for the proposal to pass.
                  </p>
                </TooltipContent>
              </Tooltip>
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

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Outcome</div>
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
    </TooltipProvider>
  );
};

export default ProposalMetrics;
