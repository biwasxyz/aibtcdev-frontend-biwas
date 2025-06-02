"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  HistoryIcon,
  Vote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { useClipboard } from "@/helpers/clipboard-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Vote as VoteType } from "@/queries/vote-queries";
import { DAOVetoProposal } from "@/components/daos/proposal/DAOVetoProposal";
import { useState } from "react";

interface VotesViewProps {
  votes: VoteType[];
}

interface VoteCardProps {
  vote: VoteType;
  copiedText: string | null;
  copyToClipboard: (text: string) => void;
}

function VoteCard({ vote, copiedText, copyToClipboard }: VoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        {/* Main Info - Always Visible */}
        <div className="space-y-4">
          {/* Top Row: DAO and Vote */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">{vote.dao_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {vote.answer ? (
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Yes
                </Badge>
              ) : (
                <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  No
                </Badge>
              )}
              {vote.confidence !== null && (
                <Badge 
                  className={`${
                    (vote.confidence * 100) >= 80 
                      ? "bg-green-500/20 text-green-500 border-green-500/30" 
                      : (vote.confidence * 100) >= 60 
                      ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                      : "bg-destructive/20 text-destructive border-destructive/30"
                  }`}
                >
                  {Math.round(vote.confidence * 100)}%
                </Badge>
              )}
            </div>
          </div>

          {/* Proposal Title */}
          <div>
            <h3 className="font-medium text-foreground line-clamp-2" title={vote.proposal_title}>
              {vote.proposal_title}
            </h3>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-3">
              {vote.tx_id && (
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={`https://explorer.stacks.co/txid/${vote.tx_id}?chain=${
                      process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
                        ? "testnet"
                        : "mainnet"
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View TX
                  </a>
                </Button>
              )}
              {vote.reasoning && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      View Reasoning
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-4xl bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Vote Reasoning</DialogTitle>
                    </DialogHeader>
                    <div className="mt-6 prose prose-sm md:prose-base dark:prose-invert max-w-none">
                      <ReactMarkdown>{vote.reasoning}</ReactMarkdown>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {vote.dao_id && vote.proposal_id && (
                <DAOVetoProposal
                  daoId={vote.dao_id}
                  proposalId={vote.proposal_id}
                  size="sm"
                  variant="outline"
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="pt-4 border-t border-border space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {vote.amount !== null && vote.amount !== "0" && (
                  <div>
                    <span className="text-muted-foreground">Vote Amount:</span>
                    <span className="ml-2 font-medium text-foreground">{vote.amount}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Proposal ID:</span>
                  <span className="ml-2 font-medium text-foreground">{vote.proposal_id}</span>
                </div>
              </div>
              
              {vote.reasoning && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reasoning:</span>
                                         <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => copyToClipboard(vote.reasoning || "")}
                       className="p-2"
                     >
                       {copiedText === (vote.reasoning || "") ? (
                         <Check className="h-4 w-4 text-green-500" />
                       ) : (
                         <Copy className="h-4 w-4 text-muted-foreground" />
                       )}
                     </Button>
                  </div>
                  <div className="text-sm text-foreground bg-muted/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {(vote.reasoning || "").substring(0, 200)}
                    {(vote.reasoning || "").length > 200 && "..."}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function VotesView({ votes }: VotesViewProps) {
  const { copyToClipboard, copiedText } = useClipboard();

  // Calculate vote statistics
  const totalVotes = votes.length;
  const yesVotes = votes.filter((vote) => vote.answer === true).length;
  const noVotes = votes.filter((vote) => vote.answer === false).length;
  const uniqueDAOs = new Set(votes.map((vote) => vote.dao_name)).size;
  const uniqueProposals = new Set(votes.map((vote) => vote.proposal_id)).size;

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <div className="space-y-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <Vote className="h-8 w-8 text-primary" />
                  My Votes
                </h1>
                <p className="text-muted-foreground mt-3">
                  View all your voting activity across DAOs and proposals
                </p>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-4 py-2">
                Voting Dashboard
              </Badge>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <HistoryIcon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <span className="text-xs md:text-sm text-muted-foreground">Total Votes</span>
                </div>
                <span className="text-xl md:text-2xl font-bold text-foreground">{totalVotes}</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <ThumbsUp className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                  <span className="text-xs md:text-sm text-muted-foreground">Yes Votes</span>
                </div>
                <span className="text-xl md:text-2xl font-bold text-green-500">{yesVotes}</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <ThumbsDown className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
                  <span className="text-xs md:text-sm text-muted-foreground">No Votes</span>
                </div>
                <span className="text-xl md:text-2xl font-bold text-destructive">{noVotes}</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <Vote className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
                  <span className="text-xs md:text-sm text-muted-foreground">DAOs</span>
                </div>
                <span className="text-xl md:text-2xl font-bold text-foreground">{uniqueDAOs}</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm col-span-2 md:col-span-3 lg:col-span-1">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <HistoryIcon className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
                  <span className="text-xs md:text-sm text-muted-foreground">Proposals</span>
                </div>
                <span className="text-xl md:text-2xl font-bold text-foreground">{uniqueProposals}</span>
              </CardContent>
            </Card>
          </div>

          {/* Voting History */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <HistoryIcon className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Voting History</h2>
            </div>
            
            {totalVotes === 0 ? (
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="text-center py-16">
                  <Vote className="h-20 w-20 text-muted mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-foreground mb-3">No votes yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Your voting activity will appear here once you start participating in DAO governance.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Visit the{" "}
                    <a href="/proposals" className="text-primary hover:text-primary/80 transition-colors duration-150">
                      Proposals page
                    </a>{" "}
                    to see active proposals you can vote on.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {votes.map((vote) => (
                  <VoteCard
                    key={vote.id}
                    vote={vote}
                    copiedText={copiedText}
                    copyToClipboard={copyToClipboard}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 