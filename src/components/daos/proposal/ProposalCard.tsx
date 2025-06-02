"use client";

import { Card, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VoteProgress from "./VoteProgress";
import { useVotingStatus } from "./TimeStatus";
import type { Proposal, ProposalWithDAO } from "@/types/supabase";
import {
  User,
  Calendar,
  Eye,
  EyeOff,
  Building2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { truncateString, getExplorerLink, formatAction } from "@/helpers/helper";
import { safeNumberFromBigInt, safeString, safeStringFromBigInt } from "@/helpers/proposal-utils";
import Link from "next/link";

interface ProposalCardProps {
  proposal: Proposal | ProposalWithDAO;
  onToggleVisibility: (proposalId: string) => void;
  isHidden: boolean;
  tokenSymbol?: string;
  showDAOInfo?: boolean; // Flag to show DAO information for cross-DAO views
}

const ProposalCard = ({
  proposal,
  onToggleVisibility,
  isHidden,
  tokenSymbol = "",
  showDAOInfo = false,
}: ProposalCardProps) => {
  const { isActive, isEnded } = useVotingStatus(
    proposal.status,
    safeNumberFromBigInt(proposal.vote_start),
    safeNumberFromBigInt(proposal.vote_end),
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

  // Get DAO name with link for cross-DAO views
  const getDAOInfo = () => {
    const proposalWithDAO = proposal as ProposalWithDAO;
    if (proposalWithDAO.daos?.name) {
      const encodedDAOName = encodeURIComponent(proposalWithDAO.daos.name);
      return (
        <Link
          href={`/daos/${encodedDAOName}`}
          className="hover:text-white transition-colors"
        >
          {proposalWithDAO.daos.name}
        </Link>
      );
    }
    return proposal.contract_principal
      ? formatAction(proposal.contract_principal)
      : "Unknown DAO";
  };

  return (
    <Card className="overflow-hidden bg-zinc-900/50 border-zinc-700/50 hover:border-zinc-600/50 transition-colors">
      <CardContent className={showDAOInfo ? "p-4 sm:p-6" : "p-6"}>
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          {/* Left side - Title and metadata */}
          <div className="flex-1 min-w-0">
            <div className={`flex items-center ${showDAOInfo ? "gap-2 sm:gap-3" : "gap-3"} mb-2`}>
              {/* Avatar placeholder */}
              <div className={`${showDAOInfo ? "w-8 h-8 sm:w-10 sm:h-10" : "w-10 h-10"} rounded-full bg-zinc-700 flex-shrink-0`} />

              {/* Title and basic info */}
              <div className="min-w-0 flex-1">
                <h3 className={`${showDAOInfo ? "text-base sm:text-lg" : "text-lg"} font-semibold text-white mb-1 truncate`}>
                  {proposal.title}
                </h3>
                
                {/* Metadata - different layout for cross-DAO vs single DAO */}
                {showDAOInfo ? (
                  // Mobile-optimized metadata for cross-DAO view
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {getDAOInfo()}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        By{" "}
                        <a
                          href={getExplorerLink("address", proposal.creator)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white transition-colors"
                        >
                          {truncateString(proposal.creator, 4, 4)}
                        </a>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(proposal.created_at), "MMM d, yyyy")}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>{getVoteSummary()}</span>
                    </div>
                  </div>
                ) : (
                  // Standard metadata for single DAO view
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <span>{getDAOInfo()}</span>
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
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className={`flex items-center ${showDAOInfo ? "gap-1 sm:gap-2" : "gap-2"} flex-shrink-0`}>
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
            contractAddress={safeString(proposal.contract_principal)}
            proposalId={showDAOInfo 
              ? safeStringFromBigInt(proposal.proposal_id) 
              : safeString(proposal.proposal_id?.toString() || "")
            }
            votesFor={safeString(proposal.votes_for)}
            votesAgainst={safeString(proposal.votes_against)}
            refreshing={false}
            tokenSymbol={tokenSymbol}
            liquidTokens={
              proposal.liquid_tokens !== null
                ? proposal.liquid_tokens.toString()
                : "0"
            }
            isActive={isActive}
          />
        </div>

        {/* Bottom section with status and view details link */}
        <div className="flex justify-between items-center">
          <CardDescription className={`text-gray-400 ${showDAOInfo ? "text-xs sm:text-sm" : ""}`}>
            {proposal.status || "Awaiting first vote"}
          </CardDescription>

          <Link href={`/proposals/${proposal.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className={`self-start text-gray-400 hover:text-white p-2 h-auto ${showDAOInfo ? "text-xs sm:text-sm" : ""}`}
            >
              <ExternalLink className={`h-4 w-4 ${showDAOInfo ? "mr-1 sm:mr-2" : "mr-2"}`} />
              {showDAOInfo ? (
                <>
                  <span className="hidden sm:inline">View Details</span>
                  <span className="sm:hidden">Details</span>
                </>
              ) : (
                "View Details"
              )}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposalCard; 