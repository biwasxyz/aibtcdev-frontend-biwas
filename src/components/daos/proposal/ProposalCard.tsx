"use client";

import { Card, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VoteStatusChart from "./VoteStatusChart";
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
        <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/50 transition-colors duration-150">
          Active
        </Badge>
      );
    } else if (isEnded && proposal.passed) {
      return (
        <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50 transition-colors duration-150">
          Passed
        </Badge>
      );
    } else if (isEnded && !proposal.passed) {
      return (
        <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/50 transition-colors duration-150">
          Failed
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-muted/50 text-muted-foreground hover:bg-muted/70 border-muted transition-colors duration-150">
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
          className="hover:text-foreground transition-colors duration-150"
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
    <Card className="overflow-hidden bg-card border-border shadow-sm hover:border-border/80 transition-colors duration-150">
      <CardContent className={showDAOInfo ? "p-6 sm:p-8" : "p-8"}>
        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
          {/* Left side - Title and metadata */}
          <div className="flex-1 min-w-0">
            <div className={`flex items-center ${showDAOInfo ? "gap-3 sm:gap-4" : "gap-4"} mb-3`}>
              {/* Avatar placeholder */}
              <div className={`${showDAOInfo ? "w-10 h-10 sm:w-12 sm:h-12" : "w-12 h-12"} rounded-full bg-muted flex-shrink-0`} />

              {/* Title and basic info */}
              <div className="min-w-0 flex-1">
                <h3 className={`${showDAOInfo ? "text-lg sm:text-xl" : "text-xl"} font-semibold text-foreground mb-2 truncate`}>
                  {proposal.title}
                </h3>
                
                {/* Metadata - different layout for cross-DAO vs single DAO */}
                {showDAOInfo ? (
                  // Mobile-optimized metadata for cross-DAO view
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {getDAOInfo()}
                      </span>
                      <span className="hidden sm:inline text-muted">•</span>
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        By{" "}
                        <a
                          href={getExplorerLink("address", proposal.creator)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground transition-colors duration-150"
                        >
                          {truncateString(proposal.creator, 4, 4)}
                        </a>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(proposal.created_at), "MMM d, yyyy")}
                      </span>
                      <span className="hidden sm:inline text-muted">•</span>
                      <span className="font-medium">{getVoteSummary()}</span>
                    </div>
                  </div>
                ) : (
                  // Standard metadata for single DAO view
                  <div className="flex items-center gap-3 text-base text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span>{getDAOInfo()}</span>
                    </span>
                    <span className="text-muted">•</span>
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      By {truncateString(proposal.creator, 6, 4)}
                    </span>
                    <span className="text-muted">•</span>
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {proposal.created_at
                        ? format(new Date(proposal.created_at), "MMM dd, yyyy")
                        : "Unknown date"}
                    </span>
                    <span className="text-muted">•</span>
                    <span className="font-medium">{getVoteSummary()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className={`flex items-center ${showDAOInfo ? "gap-2 sm:gap-3" : "gap-3"} flex-shrink-0`}>
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleVisibility(proposal.id)}
              className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors duration-150"
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
          <div className="mb-6">
            <Badge
              variant="outline"
              className="text-secondary border-secondary/50 bg-secondary/10 hover:bg-secondary/20 transition-colors duration-150"
            >
              {proposal.type.toUpperCase()}
            </Badge>
          </div>
        )}

        {/* Vote Progress - Always visible */}
        <div className="mb-6">
          <VoteStatusChart
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
          <CardDescription className={`text-muted-foreground ${showDAOInfo ? "text-sm sm:text-base" : "text-base"}`}>
            {proposal.status || "Awaiting first vote"}
          </CardDescription>

          <Link href={`/proposals/${proposal.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className={`text-muted-foreground hover:text-foreground transition-colors duration-150 ${showDAOInfo ? "text-sm sm:text-base px-3 py-2" : "px-4 py-2"}`}
            >
              <ExternalLink className={`h-4 w-4 ${showDAOInfo ? "mr-2 sm:mr-3" : "mr-3"}`} />
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