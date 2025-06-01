"use client";

import { useState } from "react";
import { Card, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VoteProgress from "@/components/daos/proposal/VoteProgress";
import ProposalDetails from "@/components/daos/proposal/ProposalDetails";
import { useVotingStatus } from "@/components/daos/proposal/TimeStatus";
import type { Proposal } from "@/types/supabase";
import {
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import { truncateString, formatAction } from "@/helpers/helper";

interface DAOProposalsProps {
  proposals: Proposal[];
}

const DAOProposals = ({ proposals }: DAOProposalsProps) => {
  const [hiddenProposals, setHiddenProposals] = useState<Set<string>>(
    new Set(),
  );

  const toggleProposalVisibility = (proposalId: string) => {
    setHiddenProposals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(proposalId)) {
        newSet.delete(proposalId);
      } else {
        newSet.add(proposalId);
      }
      return newSet;
    });
  };

  const visibleProposals = proposals.filter(
    (proposal) => !hiddenProposals.has(proposal.id),
  );

  const hiddenCount = hiddenProposals.size;

  return (
    <div className="space-y-6">
      {/* Hidden proposals notice */}
      {hiddenCount > 0 && (
        <div className="text-sm text-gray-400 bg-gray-800/30 p-3 rounded-md">
          {hiddenCount} proposal{hiddenCount > 1 ? "s" : ""} hidden
        </div>
      )}

      {/* Visible proposals */}
      {visibleProposals.map((proposal) => (
        <EnhancedProposalCard
          key={proposal.id}
          proposal={proposal}
          onToggleVisibility={toggleProposalVisibility}
          isHidden={false}
        />
      ))}

      {/* Hidden proposals toggle */}
      {hiddenCount > 0 && (
        <div className="pt-4 border-t border-gray-600">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">
            Hidden Proposals ({hiddenCount})
          </h3>
          {Array.from(hiddenProposals).map((proposalId) => {
            const proposal = proposals.find((p) => p.id === proposalId);
            return proposal ? (
              <EnhancedProposalCard
                key={proposal.id}
                proposal={proposal}
                onToggleVisibility={toggleProposalVisibility}
                isHidden={true}
              />
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

// Interfaces
interface EnhancedProposalCardProps {
  proposal: Proposal;
  onToggleVisibility: (proposalId: string) => void;
  isHidden: boolean;
}

const EnhancedProposalCard = ({
  proposal,
  onToggleVisibility,
  isHidden,
}: EnhancedProposalCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { isActive, isEnded } = useVotingStatus(
    proposal.status,
    proposal.vote_start,
    proposal.vote_end,
  );

  const getStatusBadge = () => {
    if (isActive) {
      return (
        <Badge className="bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 border-orange-500/50">
          Active
        </Badge>
      );
    } else if (isEnded && proposal.passed) {
      return (
        <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50">
          Passed
        </Badge>
      );
    } else if (isEnded && !proposal.passed) {
      return (
        <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50">
          Failed
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500/20 text-gray-500 hover:bg-gray-500/30 border-gray-500/50">
          Pending
        </Badge>
      );
    }
  };

  const getVoteSummary = () => {
    const votesFor = Number(proposal.votes_for || 0);
    const votesAgainst = Number(proposal.votes_against || 0);
    const totalVotes = votesFor + votesAgainst;

    if (totalVotes === 0) {
      return "0 Total Votes";
    }

    return `${totalVotes} Total Vote${totalVotes !== 1 ? "s" : ""}`;
  };

  return (
    <Card className="overflow-hidden bg-zinc-900/50 border-zinc-700/50 hover:border-zinc-600/50 transition-colors">
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          {/* Left side - Title and metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {/* Avatar placeholder */}
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0" />

              {/* Title and basic info */}
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-white mb-1 truncate">
                  {proposal.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <span>
                      {proposal.contract_principal
                        ? formatAction(proposal.contract_principal)
                        : "Unknown DAO"}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    By {truncateString(proposal.creator, 6, 4)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {proposal.created_at
                      ? format(new Date(proposal.created_at), "MMM dd, yyyy")
                      : "Unknown date"}
                  </span>
                  <span>•</span>
                  <span>{getVoteSummary()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleVisibility(proposal.id)}
              className="h-8 w-8 text-gray-400 hover:text-white"
              title={isHidden ? "Show proposal" : "Hide proposal"}
            >
              {isHidden ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Category badge if available */}
        {proposal.type && (
          <div className="mb-4">
            <Badge
              variant="outline"
              className="text-purple-400 border-purple-400/50"
            >
              {proposal.type}
            </Badge>
          </div>
        )}

        {/* Vote Progress - Always visible */}
        <div className="mb-4">
          <VoteProgress
            contractAddress={proposal.contract_principal}
            proposalId={proposal.proposal_id}
            votesFor={proposal.votes_for}
            votesAgainst={proposal.votes_against}
            refreshing={false}
            tokenSymbol={proposal.token_symbol || ""}
            liquidTokens={
              proposal.liquid_tokens !== null
                ? proposal.liquid_tokens.toString()
                : "0"
            }
            isActive={isActive}
          />
        </div>

        {/* Expand/Collapse Toggle */}
        <div className="flex justify-between items-center">
          <CardDescription className="text-gray-400">
            {proposal.status || "Awaiting first vote"}
          </CardDescription>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="self-start text-gray-400 hover:text-white p-2 h-auto"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                View Details
              </>
            )}
          </Button>
        </div>

        {/* Expanded Details - Using the reusable component */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-600">
            <ProposalDetails proposal={proposal} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DAOProposals;
