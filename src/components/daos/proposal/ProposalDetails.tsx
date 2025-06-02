"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import MessageDisplay from "./MessageDisplay";
import TimeStatus, { useVotingStatus } from "./TimeStatus";
import BlockVisual from "./BlockVisual";
import VotesTable from "./VotesTable";
import ProposalMetrics from "./ProposalMetrics";
import LabeledField from "./LabeledField";
import type { Proposal, ProposalWithDAO } from "@/types/supabase";
import {
  BarChart3,
  Blocks,
  Layers,
  ArrowRight,
  Timer,
  Wallet,
  Activity,
  Hash,
  FileText,
} from "lucide-react";
import {
  truncateString,
  getExplorerLink,
  formatAction,
} from "@/helpers/helper";
import { useQueryClient } from "@tanstack/react-query";
import { safeNumberFromBigInt, safeString } from "@/helpers/proposal-utils";

interface ProposalDetailsProps {
  proposal: Proposal | ProposalWithDAO;
  className?: string;
}

const ProposalDetails = ({
  proposal,
  className = "",
}: ProposalDetailsProps) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { isActive } = useVotingStatus(
    proposal.status,
    safeNumberFromBigInt(proposal.vote_start),
    safeNumberFromBigInt(proposal.vote_end),
  );

  const refreshVotesData = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: ["votes", proposal.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["proposals"],
      });
    } catch (error) {
      console.error("Failed to refresh votes data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, proposal.id, refreshing]);

  // Cleanup intervals on unmount
  useEffect(() => {
    const refreshInterval = refreshIntervalRef.current;
    const countdownInterval = countdownIntervalRef.current;

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, []);

  // Auto-refresh for active proposals
  useEffect(() => {
    if (isActive) {
      // Start countdown
      const countdownInterval = setInterval(() => {
        refreshVotesData();
      }, 30000); // Refresh every 30 seconds

      countdownIntervalRef.current = countdownInterval;

      return () => {
        clearInterval(countdownInterval);
      };
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [isActive, refreshVotesData]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Vote Progress Section */}
      <div className="bg-[#1A1A1A] rounded-md p-4 border border-gray-600">
        <h4 className="text-sm font-medium text-white uppercase tracking-wide mb-3">
          Voting Progress
        </h4>
        <VotesTable proposalId={proposal.id} />
      </div>

      {/* On-chain Message */}
      {proposal.content && (
        <div className="bg-[#1A1A1A] rounded-md p-4 border border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white uppercase tracking-wide">
              On-chain Message
            </h4>
          </div>
          <MessageDisplay message={proposal.content} />
        </div>
      )}

      {/* Overview Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-orange-500" />
          <h4 className="text-lg font-semibold text-white">Overview</h4>
        </div>

        <ProposalMetrics proposal={proposal} />

        {/* Timeline Status */}
        <div className="bg-[#1A1A1A] rounded-md p-4 border border-gray-600">
          <h4 className="text-sm uppercase tracking-wide mb-3 text-white">
            Timeline Status
          </h4>
          <TimeStatus
            createdAt={proposal.created_at}
            status={proposal.status}
            concludedBy={proposal.concluded_by}
            vote_start={safeNumberFromBigInt(proposal.vote_start)}
            vote_end={safeNumberFromBigInt(proposal.vote_end)}
          />
        </div>
      </div>



      {/* Blockchain Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Blocks className="h-5 w-5 text-orange-500" />
          <h4 className="text-lg font-semibold text-white">Blockchain</h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Block Information */}
          <div className="bg-[#1A1A1A] rounded-md p-4 border border-gray-600">
            <h4 className="text-sm uppercase tracking-wide mb-3 text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-orange-500" />
              Block Information
            </h4>
            <div className="space-y-3 text-sm">
              <LabeledField
                icon={Layers}
                label="Snapshot block"
                value={
                  <BlockVisual value={safeNumberFromBigInt(proposal.created_stx)} type="stacks" />
                }
              />
              <LabeledField
                icon={ArrowRight}
                label="Start block"
                value={
                  <BlockVisual value={safeNumberFromBigInt(proposal.vote_start)} type="bitcoin" />
                }
              />
              <LabeledField
                icon={Timer}
                label="End block"
                value={<BlockVisual value={safeNumberFromBigInt(proposal.vote_end)} type="bitcoin" />}
              />
            </div>
          </div>

          {/* Contract Details */}
          <div className="bg-[#1A1A1A] rounded-md p-4 border border-gray-600">
            <h4 className="text-sm uppercase tracking-wide mb-3 text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-500" />
              Contract Details
            </h4>
            <div className="space-y-3 text-sm">
              <LabeledField
                icon={Wallet}
                label="Principal"
                value={formatAction(safeString(proposal.contract_principal))}
                link={safeString(proposal.contract_principal) ? getExplorerLink("contract", proposal.contract_principal) : undefined}
              />
              <LabeledField
                icon={Activity}
                label="Action"
                value={formatAction(proposal.action)}
                link={
                  proposal.action
                    ? getExplorerLink("contract", proposal.action)
                    : undefined
                }
              />
              <LabeledField
                icon={Hash}
                label="Proposal ID"
                value={`#${proposal.proposal_id}`}
              />
              <LabeledField
                icon={Hash}
                label="Transaction ID"
                value={truncateString(proposal.tx_id, 8, 8)}
                link={getExplorerLink("tx", proposal.tx_id)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetails;
