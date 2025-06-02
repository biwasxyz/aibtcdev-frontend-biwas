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
import { Loader } from "@/components/reusables/Loader";
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
import { fetchVotes } from "@/queries/vote-queries";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { useClipboard } from "@/helpers/clipboard-utils";
import { Badge } from "@/components/ui/badge";

export function VotesView() {
  const {
    data: votes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["votes"],
    queryFn: fetchVotes,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const { copyToClipboard, copiedText } = useClipboard();

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <Vote className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Error Loading Votes</h2>
              <p className="text-gray-400 mt-2">
                {error instanceof Error ? error.message : "Failed to load votes"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate vote statistics
  const totalVotes = votes.length;
  const yesVotes = votes.filter((vote) => vote.answer === true).length;
  const noVotes = votes.filter((vote) => vote.answer === false).length;
  const uniqueDAOs = new Set(votes.map((vote) => vote.dao_name)).size;
  const uniqueProposals = new Set(votes.map((vote) => vote.proposal_id)).size;

  return (
    <div className="w-full min-h-screen bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Vote className="h-8 w-8 text-orange-500" />
                  My Votes
                </h1>
                <p className="text-gray-400 mt-1">
                  View all your voting activity across DAOs and proposals
                </p>
              </div>
              <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-sm px-3 py-1">
                Voting Dashboard
              </Badge>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-[#2A2A2A] border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <HistoryIcon className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-gray-400">Total Votes</span>
                </div>
                <span className="text-xl font-bold text-white">{totalVotes}</span>
              </CardContent>
            </Card>

            <Card className="bg-[#2A2A2A] border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-gray-400">Yes Votes</span>
                </div>
                <span className="text-xl font-bold text-green-500">{yesVotes}</span>
              </CardContent>
            </Card>

            <Card className="bg-[#2A2A2A] border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-gray-400">No Votes</span>
                </div>
                <span className="text-xl font-bold text-red-500">{noVotes}</span>
              </CardContent>
            </Card>

            <Card className="bg-[#2A2A2A] border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Vote className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-gray-400">DAOs</span>
                </div>
                <span className="text-xl font-bold text-white">{uniqueDAOs}</span>
              </CardContent>
            </Card>

            <Card className="bg-[#2A2A2A] border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <HistoryIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-gray-400">Proposals</span>
                </div>
                <span className="text-xl font-bold text-white">{uniqueProposals}</span>
              </CardContent>
            </Card>
          </div>

          {/* Voting History Table */}
          <Card className="bg-[#2A2A2A] border-gray-600">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <HistoryIcon className="h-5 w-5 text-orange-500" />
                Voting History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalVotes === 0 ? (
                <div className="text-center py-12">
                  <Vote className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No votes yet</h3>
                  <p className="text-gray-400 mb-4">
                    Your voting activity will appear here once you start participating in DAO governance.
                  </p>
                  <p className="text-sm text-gray-500">
                    Visit the{" "}
                    <a href="/proposals" className="text-orange-500 hover:text-orange-400">
                      Proposals page
                    </a>{" "}
                    to see active proposals you can vote on.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="whitespace-nowrap text-gray-300">
                          DAO
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-gray-300">
                          Proposal
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-gray-300">
                          Vote
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-gray-300">
                          Amount
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-gray-300">
                          Confidence
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-gray-300">
                          Date
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-gray-300">
                          Reasoning
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-gray-300">
                          TX
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {votes.map((vote) => (
                        <TableRow key={vote.id} className="border-gray-600">
                          <TableCell className="text-gray-300">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-600 flex-shrink-0" />
                              <span className="truncate">{vote.dao_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="max-w-xs truncate text-gray-300"
                              title={vote.proposal_title}
                            >
                              {vote.proposal_title}
                            </div>
                          </TableCell>
                          <TableCell>
                            {vote.answer ? (
                              <span className="flex items-center text-green-500 font-medium">
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                Yes
                              </span>
                            ) : (
                              <span className="flex items-center text-red-500 font-medium">
                                <ThumbsDown className="h-4 w-4 mr-1" />
                                No
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {vote.amount !== null && vote.amount !== "0" ? (
                              <span className="text-gray-300">{vote.amount}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {vote.confidence !== null ? (
                              <Badge 
                                className={`${
                                  vote.confidence >= 80 
                                    ? "bg-green-500/20 text-green-500 border-green-500/30" 
                                    : vote.confidence >= 60 
                                    ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                                    : "bg-red-500/20 text-red-500 border-red-500/30"
                                }`}
                              >
                                {vote.confidence}%
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-gray-300">
                            {formatDistanceToNow(new Date(vote.created_at), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell>
                            {vote.reasoning ? (
                              <div className="flex items-center gap-2">
                                <Dialog>
                                  <DialogTrigger className="cursor-pointer text-orange-500 hover:text-orange-400 transition-colors">
                                    <div className="max-w-xs truncate">
                                      {vote.reasoning
                                        .substring(0, 40)
                                        .replace(/[#*`_~[\]]/g, "")}
                                      {vote.reasoning.length > 40 ? "..." : ""}
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent className="w-[80vw] max-w-5xl bg-[#2A2A2A] border-gray-600">
                                    <DialogHeader>
                                      <DialogTitle className="text-white">
                                        Vote Reasoning
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4 prose prose-sm md:prose-base dark:prose-invert max-w-none px-2">
                                      <ReactMarkdown>{vote.reasoning}</ReactMarkdown>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <button
                                  onClick={() => copyToClipboard(vote.reasoning || "")}
                                  className="p-1 hover:bg-gray-700 rounded-md transition-colors"
                                  title="Copy reasoning"
                                >
                                  {copiedText === vote.reasoning ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400">No reasoning provided</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {vote.tx_id ? (
                              <a
                                href={`https://explorer.stacks.co/txid/${vote.tx_id}?chain=${
                                  process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
                                    ? "testnet"
                                    : "mainnet"
                                }`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-500 hover:text-orange-400 transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
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