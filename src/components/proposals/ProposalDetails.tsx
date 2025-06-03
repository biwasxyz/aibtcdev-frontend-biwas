"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import MessageDisplay from "./MessageDisplay";
import TimeStatus, { useVotingStatus } from "./TimeStatus";
import BlockVisual from "./BlockVisual";
import VotesTable from "./VotesTable";
import VotingProgressChart from "./VotingProgressChart";
// import VoteStatusChart from "./VoteStatusChart";
import LabeledField from "./LabeledField";
import type { Proposal, ProposalWithDAO } from "@/types/supabase";
import {
  Blocks,
  Layers,
  ArrowRight,
  Timer,
  Wallet,
  Activity,
  Hash,
  FileText,
  TrendingUp,
  Clock,
  Vote,
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
    <div className={`space-y-12 ${className}`}>
      {/* Hero Progress Section - Full Width */}
      <div className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-border/50 shadow-lg">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">Voting Progress</h3>
            <p className="text-muted-foreground">Real-time proposal voting analytics</p>
          </div>
        </div>
        <VotingProgressChart proposal={proposal} tokenSymbol={tokenSymbol} />
      </div>

      {/* Bento Grid: Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Vote Details (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Vote Details Table */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-border/80 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Vote className="h-6 w-6 text-primary" />
              <h4 className="text-xl font-semibold text-foreground">Vote Details</h4>
            </div>
            <VotesTable proposalId={proposal.id} />
          </div>

          {/* On-chain Message */}
          {proposal.content && (
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-border/80 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-6 w-6 text-primary" />
                <h4 className="text-xl font-semibold text-foreground">On-chain Message</h4>
              </div>
              <MessageDisplay message={proposal.content} />
            </div>
          )}
        </div>

        {/* Right Column: Timeline (1/3 width) */}
        <div className="space-y-8">
          {/* Timeline Status */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-border/80 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="h-6 w-6 text-primary" />
              <h4 className="text-xl font-semibold text-foreground">Timeline</h4>
            </div>
            <TimeStatus
              createdAt={proposal.created_at}
              status={proposal.status}
              concludedBy={proposal.concluded_by}
              vote_start={safeNumberFromBigInt(proposal.vote_start)}
              vote_end={safeNumberFromBigInt(proposal.vote_end)}
            />
          </div>
        </div>
      </div>

      {/* Blockchain Information - Bento Grid Layout */}
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
            <Blocks className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground tracking-tight">Blockchain Details</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Contract information and block-level data for this proposal
          </p>
        </div>

        {/* Two-Column Bento Grid for Blockchain Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Block Information */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-border/80 transition-all duration-300">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground">Block Information</h4>
            </div>
            
            <div className="space-y-6">
              <div className="bg-muted/30 rounded-xl p-4">
                <LabeledField
                  icon={Layers}
                  label="Snapshot Block"
                  value={
                    <BlockVisual value={safeNumberFromBigInt(proposal.created_stx)} type="stacks" />
                  }
                />
              </div>
              
              <div className="bg-muted/30 rounded-xl p-4">
                <LabeledField
                  icon={ArrowRight}
                  label="Start Block"
                  value={
                    <BlockVisual value={safeNumberFromBigInt(proposal.vote_start)} type="bitcoin" />
                  }
                />
              </div>
              
              <div className="bg-muted/30 rounded-xl p-4">
                <LabeledField
                  icon={Timer}
                  label="End Block"
                  value={<BlockVisual value={safeNumberFromBigInt(proposal.vote_end)} type="bitcoin" />}
                />
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-border/80 transition-all duration-300">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground">Contract Details</h4>
            </div>
            
            <div className="space-y-6">
              <div className="bg-muted/30 rounded-xl p-4">
                <LabeledField
                  icon={Wallet}
                  label="Principal"
                  value={formatAction(safeString(proposal.contract_principal))}
                  link={safeString(proposal.contract_principal) ? getExplorerLink("contract", proposal.contract_principal) : undefined}
                />
              </div>
              
              <div className="bg-muted/30 rounded-xl p-4">
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
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-xl p-4">
                  <LabeledField
                    icon={Hash}
                    label="Proposal ID"
                    value={`#${proposal.proposal_id}`}
                  />
                </div>
                
                <div className="bg-muted/30 rounded-xl p-4">
                  <LabeledField
                    icon={Hash}
                    label="Transaction"
                    value={truncateString(proposal.tx_id, 8, 8)}
                    link={getExplorerLink("tx", proposal.tx_id)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetails;
