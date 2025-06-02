"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  HistoryIcon,
  Vote,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { Vote as VoteType } from "@/queries/vote-queries";
import { DAOVetoProposal } from "@/components/daos/proposal/DAOVetoProposal";

interface VotesViewProps {
  votes: VoteType[];
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <HistoryIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Votes</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{totalVotes}</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <ThumbsUp className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Yes Votes</span>
                </div>
                <span className="text-2xl font-bold text-green-500">{yesVotes}</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <ThumbsDown className="h-5 w-5 text-destructive" />
                  <span className="text-sm text-muted-foreground">No Votes</span>
                </div>
                <span className="text-2xl font-bold text-destructive">{noVotes}</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Vote className="h-5 w-5 text-secondary" />
                  <span className="text-sm text-muted-foreground">DAOs</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{uniqueDAOs}</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <HistoryIcon className="h-5 w-5 text-secondary" />
                  <span className="text-sm text-muted-foreground">Proposals</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{uniqueProposals}</span>
              </CardContent>
            </Card>
          </div>

          {/* Voting History Table */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                <HistoryIcon className="h-6 w-6 text-primary" />
                Voting History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {totalVotes === 0 ? (
                <div className="text-center py-16">
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
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border bg-muted/50">
                        <TableHead className="whitespace-nowrap text-muted-foreground font-medium h-12">
                          DAO
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-muted-foreground font-medium h-12">
                          Proposal
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-muted-foreground font-medium h-12">
                          Vote
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-muted-foreground font-medium h-12">
                          Amount
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-muted-foreground font-medium h-12">
                          Confidence
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-muted-foreground font-medium h-12">
                          Date
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-muted-foreground font-medium h-12">
                          Reasoning
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-muted-foreground font-medium h-12">
                          TX
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-muted-foreground font-medium h-12">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {votes.map((vote) => (
                        <TableRow key={vote.id} className="border-border hover:bg-muted/30 transition-colors duration-150">
                          <TableCell className="text-foreground py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0" />
                              <span className="truncate font-medium">{vote.dao_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div
                              className="max-w-xs truncate text-foreground"
                              title={vote.proposal_title}
                            >
                              {vote.proposal_title}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {vote.answer ? (
                              <span className="flex items-center text-green-500 font-medium">
                                <ThumbsUp className="h-4 w-4 mr-2" />
                                Yes
                              </span>
                            ) : (
                              <span className="flex items-center text-destructive font-medium">
                                <ThumbsDown className="h-4 w-4 mr-2" />
                                No
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            {vote.amount !== null && vote.amount !== "0" ? (
                              <span className="text-foreground font-medium">{vote.amount}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            {vote.confidence !== null ? (
                              <Badge 
                                className={`${
                                  vote.confidence >= 80 
                                    ? "bg-green-500/20 text-green-500 border-green-500/30" 
                                    : vote.confidence >= 60 
                                    ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                                    : "bg-destructive/20 text-destructive border-destructive/30"
                                }`}
                              >
                                {vote.confidence}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground py-4">
                            {formatDistanceToNow(new Date(vote.created_at), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell className="py-4">
                            {vote.reasoning ? (
                              <div className="flex items-center gap-3">
                                <Dialog>
                                  <DialogTrigger className="cursor-pointer text-primary hover:text-primary/80 transition-colors duration-150">
                                    <div className="max-w-xs truncate">
                                      {vote.reasoning
                                        .substring(0, 40)
                                        .replace(/[#*`_~[\]]/g, "")}
                                      {vote.reasoning.length > 40 ? "..." : ""}
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent className="w-[80vw] max-w-5xl bg-card border-border">
                                    <DialogHeader>
                                      <DialogTitle className="text-foreground">
                                        Vote Reasoning
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-6 prose prose-sm md:prose-base dark:prose-invert max-w-none px-3">
                                      <ReactMarkdown>{vote.reasoning}</ReactMarkdown>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <button
                                  onClick={() => copyToClipboard(vote.reasoning || "")}
                                  className="p-2 hover:bg-muted rounded-lg transition-colors duration-150"
                                  title="Copy reasoning"
                                >
                                  {copiedText === vote.reasoning ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No reasoning provided</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            {vote.tx_id ? (
                              <a
                                href={`https://explorer.stacks.co/txid/${vote.tx_id}?chain=${
                                  process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
                                    ? "testnet"
                                    : "mainnet"
                                }`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors duration-150"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            {vote.dao_id && vote.proposal_id ? (
                              <DAOVetoProposal
                                daoId={vote.dao_id}
                                proposalId={parseInt(vote.proposal_id, 10)}
                                size="sm"
                                variant="outline"
                              />
                            ) : (
                              <span className="text-muted-foreground text-xs">Not available</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 