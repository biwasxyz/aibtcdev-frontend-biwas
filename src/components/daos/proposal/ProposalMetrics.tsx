import type React from "react";
import type { Proposal } from "@/types/supabase";
import { CheckCircle2, XCircle } from "lucide-react";
import { useVotingStatus } from "./TimeStatus";

interface ProposalMetricsProps {
  proposal: Proposal;
}

const ProposalMetrics: React.FC<ProposalMetricsProps> = ({ proposal }) => {
  const { isActive } = useVotingStatus(
    proposal.status,
    proposal.start_block,
    proposal.end_block
  );

  const formatNumber = (num: number): string => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Quorum */}
      <div className="space-y-1">
        <div className="text-md font-bold text-muted-foreground">Quorum</div>
        <div className="text-xs text-muted-foreground">
          The minimum number of votes needed for a valid decision.
        </div>
        <div className="flex items-center">
          {isActive ? (
            <span className="font-medium text-sm text-blue-500">Pending</span>
          ) : proposal.met_quorum ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-1.5" />
              <span className="font-medium text-sm">Met</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500 mr-1.5" />
              <span className="font-medium text-sm">Not Met</span>
            </>
          )}
        </div>
      </div>

      {/* Threshold */}
      <div className="space-y-1">
        <div className="text-md font-bold text-muted-foreground">Threshold</div>
        <div className="text-xs text-muted-foreground">
          The required percentage of &apos;Yes&apos; votes required to pass the
          proposal.
        </div>
        <div className="flex items-center">
          {isActive ? (
            <span className="font-medium text-sm text-blue-500">Pending</span>
          ) : proposal.met_threshold ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-1.5" />
              <span className="font-medium text-sm">Met</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500 mr-1.5" />
              <span className="font-medium text-sm">Not Met</span>
            </>
          )}
        </div>
      </div>

      {/* Outcome */}
      <div className="space-y-1">
        <div className="text-md font-bold text-muted-foreground">Outcome</div>
        <div className="text-xs text-muted-foreground">
          Shows if the proposal passed or failed.
        </div>
        <div className="flex items-center">
          {isActive ? (
            <span className="font-medium text-sm text-blue-500">Pending</span>
          ) : proposal.passed ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-1.5" />
              <span className="font-medium text-sm">Passed</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500 mr-1.5" />
              <span className="font-medium text-sm">Failed</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalMetrics;
