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
  Vote,
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
        <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 border-blue-500/50 transition-all duration-300 font-medium px-3 py-1.5">
          Active
        </Badge>
      );
    } else if (isEnded && proposal.passed) {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-emerald-500/50 transition-all duration-300 font-medium px-3 py-1.5">
          Passed
        </Badge>
      );
    } else if (isEnded && !proposal.passed) {
      return (
        <Badge className="bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 border-rose-500/50 transition-all duration-300 font-medium px-3 py-1.5">
          Failed
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-muted/50 text-muted-foreground hover:bg-muted/70 border-muted/50 transition-all duration-300 font-medium px-3 py-1.5">
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
          className="hover:text-foreground transition-colors duration-300 font-medium"
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
    <Card className="overflow-hidden bg-card/30 backdrop-blur-sm border-border/30 hover:border-border/50 hover:bg-card/40 transition-all duration-300 group">
      <CardContent className="p-8">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-8">
          {/* Left side - Title and metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-4">
              {/* Enhanced Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Vote className="h-8 w-8 text-primary" />
                </div>
              </div>

              {/* Title and basic info */}
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                  {proposal.title}
                </h3>
                
                {/* Enhanced Metadata */}
                {showDAOInfo ? (
                  // Cross-DAO view with clean styling
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {getDAOInfo()}
                      </span>
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        By{" "}
                        <a
                          href={getExplorerLink("address", proposal.creator)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground transition-colors duration-300 font-medium"
                        >
                          {truncateString(proposal.creator, 4, 4)}
                        </a>
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(proposal.created_at), "MMM d, yyyy")}
                      </span>
                      <span className="text-primary font-medium">
                        {getVoteSummary()}
                      </span>
                    </div>
                  </div>
                ) : (
                  // Single DAO view with clean styling
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {getDAOInfo()}
                    </span>
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      By {truncateString(proposal.creator, 6, 4)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {proposal.created_at
                        ? format(new Date(proposal.created_at), "MMM dd, yyyy")
                        : "Unknown date"}
                    </span>
                    <span className="text-primary font-medium">
                      {getVoteSummary()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleVisibility(proposal.id)}
              className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all duration-300"
              title={isHidden ? "Show proposal" : "Hide proposal"}
            >
              {isHidden ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Category badge if available */}
        {proposal.type && (
          <div className="mb-6">
            <Badge
              variant="outline"
              className="text-secondary border-secondary/50 bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 px-4 py-2 rounded-xl font-medium"
            >
              {proposal.type.toUpperCase()}
            </Badge>
          </div>
        )}

        {/* Vote Progress - Clean integration */}
        <div className="mb-8">
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

        {/* Bottom section - simplified */}
        <div className="flex justify-between items-center pt-6 border-t border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary/60" />
            <CardDescription className="text-muted-foreground">
              {proposal.status || "Awaiting first vote"}
            </CardDescription>
          </div>

          <Link href={`/proposals/${proposal.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-300 px-4 py-2 rounded-xl group/button"
            >
              <ExternalLink className="h-4 w-4 mr-3 group-hover/button:scale-110 transition-transform duration-300" />
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