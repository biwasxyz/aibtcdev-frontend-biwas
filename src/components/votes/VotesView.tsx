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
  Search,
  CheckCircle,
  Clock,
  // AlertTriangle,
  Ban,
  ArrowRight,
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
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLatestChainState } from "@/queries/chain-state-queries";

interface VotesViewProps {
  votes: VoteType[];
}

interface VoteCardProps {
  vote: VoteType;
  copiedText: string | null;
  copyToClipboard: (text: string) => void;
  currentBitcoinHeight: number;
}

type TabType = 'evaluation' | 'voting' | 'veto' | 'completed';

// Helper function to safely convert bigint to number for comparison
const safeNumberFromBigInt = (value: bigint | null): number => {
  if (value === null) return 0;
  // Handle potential overflow for very large bigint values
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Number(value);
};

// Helper function to check if a vote is in the veto window
const isInVetoWindow = (vote: VoteType, currentBitcoinHeight: number): boolean => {
  if (vote.voted !== true) return false;
  if (!vote.vote_end || !vote.exec_start) return false;
  
  const voteEnd = safeNumberFromBigInt(vote.vote_end);
  const execStart = safeNumberFromBigInt(vote.exec_start);
  
  return currentBitcoinHeight > voteEnd && currentBitcoinHeight <= execStart;
};

function VoteCard({ vote, copiedText, copyToClipboard, currentBitcoinHeight }: VoteCardProps) {
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
              {vote.dao_id && vote.proposal_id && isInVetoWindow(vote, currentBitcoinHeight) && (
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
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2 font-medium text-foreground">
                    {vote.voted ? "Voted" : "Evaluating"}
                  </span>
                </div>
                {/* Block Height Details */}
                {vote.vote_start && (
                  <div>
                    <span className="text-muted-foreground">Vote Start:</span>
                    <span className="ml-2 font-medium text-foreground">
                      {safeNumberFromBigInt(vote.vote_start)}
                    </span>
                  </div>
                )}
                {vote.vote_end && (
                  <div>
                    <span className="text-muted-foreground">Vote End:</span>
                    <span className="ml-2 font-medium text-foreground">
                      {safeNumberFromBigInt(vote.vote_end)}
                    </span>
                  </div>
                )}
                {vote.exec_end && (
                  <div>
                    <span className="text-muted-foreground">Exec End:</span>
                    <span className="ml-2 font-medium text-foreground">
                      {safeNumberFromBigInt(vote.exec_end)}
                    </span>
                  </div>
                )}
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

function TabStatistics({ votes }: { votes: VoteType[]; title: string }) {
  const totalVotes = votes.length;
  const yesVotes = votes.filter((vote) => vote.answer === true).length;
  const noVotes = votes.filter((vote) => vote.answer === false).length;
  const uniqueDAOs = new Set(votes.map((vote) => vote.dao_name)).size;
  const uniqueProposals = new Set(votes.map((vote) => vote.proposal_id)).size;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <HistoryIcon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <span className="text-xs md:text-sm text-muted-foreground">Total</span>
          </div>
          <span className="text-xl md:text-2xl font-bold text-foreground">{totalVotes}</span>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <ThumbsUp className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            <span className="text-xs md:text-sm text-muted-foreground">Yes</span>
          </div>
          <span className="text-xl md:text-2xl font-bold text-green-500">{yesVotes}</span>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <ThumbsDown className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
            <span className="text-xs md:text-sm text-muted-foreground">No</span>
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
  );
}

export function VotesView({ votes }: VotesViewProps) {
  const { copyToClipboard, copiedText } = useClipboard();
  const [activeTab, setActiveTab] = useState<TabType>('evaluation');

  // Fetch current Bitcoin block height
  const { data: chainState } = useQuery({
    queryKey: ['latestChainState'],
    queryFn: fetchLatestChainState,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
  });

  const currentBitcoinHeight = chainState?.bitcoin_block_height 
    ? parseInt(chainState.bitcoin_block_height) 
    : 0;

  // Filter votes based on tab with block height logic
  const filteredVotes = useMemo(() => {
    switch (activeTab) {
      case 'evaluation':
        // Votes that haven't been voted on yet (still being evaluated)
        return votes.filter(vote => vote.voted === false);
      
      case 'voting':
        // Votes that are voted=true AND current block height is between vote_start and vote_end
        return votes.filter(vote => {
          if (vote.voted !== true) return false;
          if (!vote.vote_start || !vote.vote_end) return false;
          
          const voteStart = safeNumberFromBigInt(vote.vote_start);
          const voteEnd = safeNumberFromBigInt(vote.vote_end);
          
          return currentBitcoinHeight >= voteStart && currentBitcoinHeight <= voteEnd;
        });
      
      case 'veto':
        // Votes that are voted=true AND current block height is between vote_end and exec_start
        return votes.filter(vote => {
          if (vote.voted !== true) return false;
          if (!vote.vote_end || !vote.exec_start) return false;
          
          const voteEnd = safeNumberFromBigInt(vote.vote_end);
          const execStart = safeNumberFromBigInt(vote.exec_start);
          
          return currentBitcoinHeight > voteEnd && currentBitcoinHeight <= execStart;
        });
      
      case 'completed':
        // Votes that are voted=true AND current block height is higher than exec_end
        return votes.filter(vote => {
          if (vote.voted !== true) return false;
          if (!vote.exec_end) return false;
          
          const execEnd = safeNumberFromBigInt(vote.exec_end);
          
          return currentBitcoinHeight > execEnd;
        });
      
      default:
        return votes;
    }
  }, [votes, activeTab, currentBitcoinHeight]);

  // Calculate tab counts for badges (same logic as filtering)
  const getTabCount = (tab: TabType): number => {
    switch (tab) {
      case 'evaluation':
        return votes.filter(vote => vote.voted === false).length;
      
      case 'voting':
        return votes.filter(vote => {
          if (vote.voted !== true) return false;
          if (!vote.vote_start || !vote.vote_end) return false;
          
          const voteStart = safeNumberFromBigInt(vote.vote_start);
          const voteEnd = safeNumberFromBigInt(vote.vote_end);
          
          return currentBitcoinHeight >= voteStart && currentBitcoinHeight <= voteEnd;
        }).length;
      
      case 'veto':
        return votes.filter(vote => {
          if (vote.voted !== true) return false;
          if (!vote.vote_end || !vote.exec_start) return false;
          
          const voteEnd = safeNumberFromBigInt(vote.vote_end);
          const execStart = safeNumberFromBigInt(vote.exec_start);
          
          return currentBitcoinHeight > voteEnd && currentBitcoinHeight <= execStart;
        }).length;
      
      case 'completed':
        return votes.filter(vote => {
          if (vote.voted !== true) return false;
          if (!vote.exec_end) return false;
          
          const execEnd = safeNumberFromBigInt(vote.exec_end);
          
          return currentBitcoinHeight > execEnd;
        }).length;
      
      default:
        return votes.length;
    }
  };

  const getTabTitle = (tab: TabType): string => {
    switch (tab) {
      case 'evaluation':
        return 'Evaluation Window';
      case 'voting':
        return 'Voting Window';
      case 'veto':
        return 'Veto Window';
      case 'completed':
        return 'Execution Window';
      default:
        return 'All Votes';
    }
  };

  const getTabNumber = (tab: TabType): number => {
    switch (tab) {
      case 'evaluation':
        return 1;
      case 'voting':
        return 2;
      case 'veto':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'evaluation':
        return Search;
      case 'voting':
        return Clock;
      case 'veto':
        return Ban;
      case 'completed':
        return CheckCircle;
      default:
        return Vote;
    }
  };

  const getEmptyStateMessage = (tab: TabType): { title: string; description: string; hint: string } => {
    switch (tab) {
      case 'evaluation':
        return {
          title: 'No proposals in evaluation window',
          description: 'All proposals are currently being analyzed by AI agents before entering the voting phase.',
          hint: 'This is the first step in the proposal lifecycle where proposals are being evaluated.'
        };
      case 'voting':
        return {
          title: 'No proposals in voting window',
          description: 'There are no proposals currently in the active voting period.',
          hint: 'Proposals move here after evaluation is complete and are ready for community voting.'
        };
      case 'veto':
        return {
          title: 'No proposals in veto window',
          description: 'There are no proposals currently in the veto period.',
          hint: 'Proposals enter this window after voting ends, allowing for potential vetoes before execution.'
        };
      case 'completed':
        return {
          title: 'No proposals in execution window',
          description: 'No proposals have completed their full lifecycle yet.',
          hint: 'This is the final stage where proposals have finished their veto period and are ready for or have been executed.'
        };
      default:
        return {
          title: 'No votes found',
          description: 'Your voting activity will appear here.',
          hint: 'Visit the Proposals page to participate in governance.'
        };
    }
  };

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
                {chainState?.bitcoin_block_height && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current Bitcoin Block: {chainState.bitcoin_block_height}
                  </p>
                )}
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-4 py-2">
                Voting Dashboard
              </Badge>
            </div>
          </div>

          {/* Tab Navigation with Lifecycle Flow */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-8">
            {/* Lifecycle Flow Header */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Proposal Lifecycle Flow</h3>
              <p className="text-sm text-muted-foreground">
                Each proposal moves through these sequential windows. Track your votes across the entire governance lifecycle.
              </p>
            </div>
            
            {/* Tab Navigation with Flow Indicators */}
            <div className="flex flex-wrap items-center gap-2">
              {(['evaluation', 'voting', 'veto', 'completed'] as TabType[]).map((tab, index) => {
                const Icon = getTabIcon(tab);
                const isActive = activeTab === tab;
                const tabCount = getTabCount(tab);
                const tabNumber = getTabNumber(tab);
                const isLast = index === 3;
                
                return (
                  <div key={tab} className="flex items-center">
                    <button
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {/* Step Number */}
                      <div 
                        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          isActive 
                            ? "bg-primary-foreground/20 text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {tabNumber}
                      </div>
                      
                      <Icon className="h-4 w-4" />
                      
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{getTabTitle(tab)}</span>
                        <Badge 
                          className={`text-xs mt-1 ${
                            isActive 
                              ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                              : "bg-muted text-muted-foreground border-muted-foreground/30"
                          }`}
                        >
                          {tabCount} active
                        </Badge>
                      </div>
                    </button>
                    
                    {/* Flow Arrow */}
                    {!isLast && (
                      <ArrowRight className="h-5 w-5 text-muted-foreground mx-2 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Current Window Description */}
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const Icon = getTabIcon(activeTab);
                  return <Icon className="h-4 w-4 text-primary" />;
                })()}
                <span className="font-medium text-foreground">
                  Window {getTabNumber(activeTab)}: {getTabTitle(activeTab)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  switch (activeTab) {
                    case 'evaluation':
                      return 'Proposals are being analyzed and evaluated by AI agents before entering the voting phase.';
                    case 'voting':
                      return 'Active voting period where community members can cast their votes on proposals.';
                    case 'veto':
                      return 'Post-voting period where proposals can be vetoed before execution.';
                    case 'completed':
                      return 'Final stage where proposals have completed their lifecycle and are ready for or have been executed.';
                    default:
                      return 'Select a window to view proposals in that stage of the lifecycle.';
                  }
                })()}
              </p>
            </div>
          </div>

          {/* Statistics for Current Tab */}
          <TabStatistics votes={filteredVotes} title={getTabTitle(activeTab)} />

          {/* Voting History for Current Tab */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <HistoryIcon className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{getTabTitle(activeTab)}</h2>
            </div>
            
            {filteredVotes.length === 0 ? (
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="text-center py-16">
                  {(() => {
                    const Icon = getTabIcon(activeTab);
                    const emptyState = getEmptyStateMessage(activeTab);
                    return (
                      <>
                        <Icon className="h-20 w-20 text-muted mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-foreground mb-3">
                          {emptyState.title}
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          {emptyState.description}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {emptyState.hint}{" "}
                          {activeTab === 'evaluation' && (
                            <>
                              Visit the{" "}
                              <a href="/proposals" className="text-primary hover:text-primary/80 transition-colors duration-150">
                                Proposals page
                              </a>{" "}
                              to see active proposals.
                            </>
                          )}
                        </p>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredVotes.map((vote) => (
                  <VoteCard
                    key={vote.id}
                    vote={vote}
                    copiedText={copiedText}
                    copyToClipboard={copyToClipboard}
                    currentBitcoinHeight={currentBitcoinHeight}
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