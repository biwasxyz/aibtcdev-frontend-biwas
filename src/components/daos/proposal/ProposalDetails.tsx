"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import MessageDisplay from "./MessageDisplay";
import TimeStatus, { useVotingStatus } from "./TimeStatus";
import BlockVisual from "./BlockVisual";
import VotesTable from "./VotesTable";
import VotingProgressChart from "./VotingProgressChart";
import VoteStatusChart from "./VoteStatusChart";
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
  tokenSymbol?: string;
}

const ProposalDetails = ({
  proposal,
  className = "",
  tokenSymbol = "",
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
    <div className={`space-y-8 ${className}`}>
      {/* Visual Voting Progress */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <h4 className="text-sm font-medium text-foreground uppercase tracking-wide mb-6">
          Voting Progress
        </h4>
        <VotingProgressChart proposal={proposal} tokenSymbol={tokenSymbol} />
        
        {/* <div className="mt-6">
          <VoteStatusChart
            votesFor={proposal.votes_for?.toString()}
            votesAgainst={proposal.votes_against?.toString()}
            contractAddress={proposal.contract_principal}
            proposalId={proposal.proposal_id?.toString()}
            tokenSymbol={tokenSymbol}
            liquidTokens={proposal.liquid_tokens?.toString() || "0"}
            isActive={isActive}
          />
        </div> */}
      </div>

      {/* Detailed Votes Table */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <h4 className="text-sm font-medium text-foreground uppercase tracking-wide mb-4">
          Vote Details
        </h4>
        <VotesTable proposalId={proposal.id} />
      </div>

      {/* On-chain Message */}
      {proposal.content && (
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-foreground uppercase tracking-wide">
              On-chain Message
            </h4>
          </div>
          <MessageDisplay message={proposal.content} />
        </div>
      )}

      {/* Overview Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h4 className="text-xl font-semibold text-foreground">Overview</h4>
        </div>


        {/* Timeline Status */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h4 className="text-sm uppercase tracking-wide mb-4 text-foreground">
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
      <div className="space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <Blocks className="h-6 w-6 text-primary" />
          <h4 className="text-xl font-semibold text-foreground">Blockchain</h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Block Information */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <h4 className="text-sm uppercase tracking-wide mb-4 text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Block Information
            </h4>
            <div className="space-y-4 text-sm">
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
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <h4 className="text-sm uppercase tracking-wide mb-4 text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Contract Details
            </h4>
            <div className="space-y-4 text-sm">
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
