"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Vote,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle,
  Clock,
  Ban,
  Activity,
  TrendingUp,
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
import { DAOVetoProposal } from "@/components/proposals/DAOVetoProposal";
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
    <Card className="group bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-8">
        {/* Minimalist Header - Increased spacing */}
        <div className="space-y-6">
          {/* Clean Top Row with Better Visual Hierarchy */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0 flex items-center justify-center">
                <Vote className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground text-lg">{vote.dao_name}</p>
                <p className="text-sm text-muted-foreground/80">
                  {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            {/* Simplified Badge Design */}
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline"
                className={`px-4 py-2 text-sm font-medium border-2 ${
                  vote.answer 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" 
                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                }`}
              >
                {vote.answer ? (
                  <><ThumbsUp className="h-3 w-3 mr-2" />Yes</>
                ) : (
                  <><ThumbsDown className="h-3 w-3 mr-2" />No</>
                )}
              </Badge>
              
              {vote.confidence !== null && (
                <Badge 
                  variant="secondary"
                  className="px-3 py-1 text-xs font-medium bg-muted/50"
                >
                  {Math.round(vote.confidence * 100)}% confidence
                </Badge>
              )}
            </div>
          </div>

          {/* Clean Proposal Title with Better Typography */}
          <div className="py-4">
            <h3 className="text-xl font-medium text-foreground leading-relaxed line-clamp-2" title={vote.proposal_title}>
              {vote.proposal_title}
            </h3>
          </div>

          {/* Minimal Action Row */}
          <div className="flex items-center justify-between pt-6 border-t border-border/30">
            <div className="flex items-center gap-4">
              {vote.tx_id && (
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary h-9 px-4">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  <span className="text-sm">Explorer</span>
                </Button>
              )}
              
              {vote.reasoning && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary h-9 px-4">
                      <span className="text-sm">View Reasoning</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-4xl bg-card/95 backdrop-blur-md border-border/50">
                    <DialogHeader className="pb-6">
                      <DialogTitle className="text-xl font-medium text-foreground">Vote Reasoning</DialogTitle>
                    </DialogHeader>
                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none leading-relaxed">
                      <ReactMarkdown>{vote.reasoning}</ReactMarkdown>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <div className="flex items-center gap-3">
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
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Expanded Details with Bento Grid Layout */}
          {isExpanded && (
            <div className="pt-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
              {/* Bento Grid for Vote Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {vote.amount !== null && vote.amount !== "0" && (
                  <div className="bg-muted/30 rounded-xl p-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Vote Amount</div>
                    <div className="text-lg font-medium text-foreground">{vote.amount}</div>
                  </div>
                )}
                
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Proposal ID</div>
                  <div className="text-lg font-medium text-foreground">{vote.proposal_id}</div>
                </div>
                
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Status</div>
                  <div className="text-lg font-medium text-foreground">
                    {vote.voted ? "Voted" : "Evaluating"}
                  </div>
                </div>
              </div>

              {/* Block Heights in Clean Grid */}
              {(vote.vote_start || vote.vote_end || vote.exec_end) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vote.vote_start && (
                    <div className="text-center py-4 rounded-lg bg-muted/20">
                      <div className="text-xs text-muted-foreground mb-1">Vote Start</div>
                      <div className="text-sm font-medium text-foreground">{safeNumberFromBigInt(vote.vote_start)}</div>
                    </div>
                  )}
                  {vote.vote_end && (
                    <div className="text-center py-4 rounded-lg bg-muted/20">
                      <div className="text-xs text-muted-foreground mb-1">Vote End</div>
                      <div className="text-sm font-medium text-foreground">{safeNumberFromBigInt(vote.vote_end)}</div>
                    </div>
                  )}
                  {vote.exec_end && (
                    <div className="text-center py-4 rounded-lg bg-muted/20">
                      <div className="text-xs text-muted-foreground mb-1">Exec End</div>
                      <div className="text-sm font-medium text-foreground">{safeNumberFromBigInt(vote.exec_end)}</div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Reasoning with Improved Layout */}
              {vote.reasoning && (
                <div className="bg-muted/20 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">Reasoning</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(vote.reasoning || "")}
                      className="p-2"
                    >
                      {copiedText === (vote.reasoning || "") ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {(vote.reasoning || "").substring(0, 300)}
                    {(vote.reasoning || "").length > 300 && "..."}
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

function MetricsGrid({ votes }: { votes: VoteType[] }) {
  const totalVotes = votes.length;
  const yesVotes = votes.filter((vote) => vote.answer === true).length;
  const noVotes = votes.filter((vote) => vote.answer === false).length;
  const uniqueDAOs = new Set(votes.map((vote) => vote.dao_name)).size;
  const uniqueProposals = new Set(votes.map((vote) => vote.proposal_id)).size;

  const metrics = [
    { label: "Total Votes", value: totalVotes, icon: Activity, color: "text-primary" },
    { label: "Yes Votes", value: yesVotes, icon: ThumbsUp, color: "text-emerald-500" },
    { label: "No Votes", value: noVotes, icon: ThumbsDown, color: "text-rose-500" },
    { label: "DAOs", value: uniqueDAOs, icon: Vote, color: "text-blue-500" },
    { label: "Proposals", value: uniqueProposals, icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
      {metrics.map((metric) => (
        <Card key={metric.label} className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-border/80 transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center space-y-3">
              <metric.icon className={`h-8 w-8 ${metric.color}`} />
              <div className="space-y-1">
                <div className="text-3xl font-bold text-foreground">{metric.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{metric.label}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
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
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const currentBitcoinHeight = chainState?.bitcoin_block_height 
    ? parseInt(chainState.bitcoin_block_height) 
    : 0;

  // Filter votes based on tab with block height logic
  const filteredVotes = useMemo(() => {
    switch (activeTab) {
      case 'evaluation':
        return votes.filter(vote => vote.voted === false);
      
      case 'voting':
        return votes.filter(vote => {
          if (vote.voted !== true) return false;
          if (!vote.vote_start || !vote.vote_end) return false;
          
          const voteStart = safeNumberFromBigInt(vote.vote_start);
          const voteEnd = safeNumberFromBigInt(vote.vote_end);
          
          return currentBitcoinHeight >= voteStart && currentBitcoinHeight <= voteEnd;
        });
      
      case 'veto':
        return votes.filter(vote => {
          if (vote.voted !== true) return false;
          if (!vote.vote_end || !vote.exec_start) return false;
          
          const voteEnd = safeNumberFromBigInt(vote.vote_end);
          const execStart = safeNumberFromBigInt(vote.exec_start);
          
          return currentBitcoinHeight > voteEnd && currentBitcoinHeight <= execStart;
        });
      
      case 'completed':
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
      case 'evaluation': return 'Evaluation';
      case 'voting': return 'Active Voting';
      case 'veto': return 'Veto Period';
      case 'completed': return 'Completed';
      default: return 'All Votes';
    }
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'evaluation': return Search;
      case 'voting': return Clock;
      case 'veto': return Ban;
      case 'completed': return CheckCircle;
      default: return Vote;
    }
  };

  const getEmptyStateMessage = (tab: TabType) => {
    switch (tab) {
      case 'evaluation':
        return {
          title: 'No proposals being evaluated',
          description: 'All proposals have moved beyond the evaluation stage.',
          action: 'Check other windows for active proposals.'
        };
      case 'voting':
        return {
          title: 'No active voting',
          description: 'No proposals are currently open for voting.',
          action: 'New voting opportunities will appear here.'
        };
      case 'veto':
        return {
          title: 'No veto periods active',
          description: 'No proposals are currently in the veto window.',
          action: 'Completed votes will enter this stage after voting ends.'
        };
      case 'completed':
        return {
          title: 'No completed proposals',
          description: 'No proposals have finished their full lifecycle yet.',
          action: 'Completed proposals will appear here over time.'
        };
      default:
        return {
          title: 'No votes found',
          description: 'Your voting activity will appear here.',
          action: 'Visit the Proposals page to start voting.'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="space-y-16">
          {/* Minimal Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6">
              <Vote className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                Voting Dashboard
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Track your governance participation across all proposal lifecycle stages
              </p>
              {chainState?.bitcoin_block_height && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Bitcoin Block {chainState.bitcoin_block_height}
                </div>
              )}
            </div>
          </div>

          {/* Simplified Tab Navigation */}
          <div className="flex justify-center">
            <div className="inline-flex items-center p-2 bg-muted/30 rounded-2xl backdrop-blur-sm">
              {(['evaluation', 'voting', 'veto', 'completed'] as TabType[]).map((tab) => {
                const Icon = getTabIcon(tab);
                const isActive = activeTab === tab;
                const tabCount = getTabCount(tab);
                
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-background text-foreground shadow-lg"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{getTabTitle(tab)}</span>
                      <span className="text-xs opacity-70">{tabCount} active</span>
                    </div>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metrics Bento Grid */}
          <MetricsGrid votes={filteredVotes} />

          {/* Content Area */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2">{getTabTitle(activeTab)}</h2>
              <p className="text-muted-foreground">
                {filteredVotes.length > 0 
                  ? `${filteredVotes.length} ${filteredVotes.length === 1 ? 'proposal' : 'proposals'} in this stage`
                  : 'No proposals in this stage'
                }
              </p>
            </div>
            
            {filteredVotes.length === 0 ? (
              <Card className="bg-card/30 backdrop-blur-sm border-border/50">
                <CardContent className="text-center py-24">
                  {(() => {
                    const Icon = getTabIcon(activeTab);
                    const emptyState = getEmptyStateMessage(activeTab);
                    return (
                      <div className="space-y-6">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-muted/50">
                          <Icon className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-xl font-medium text-foreground">
                            {emptyState.title}
                          </h3>
                          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                            {emptyState.description}
                          </p>
                          <p className="text-sm text-muted-foreground/80">
                            {emptyState.action}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
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