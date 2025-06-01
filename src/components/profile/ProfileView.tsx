"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  HistoryIcon,
  User,
} from "lucide-react";
import { getStacksAddress } from "@/lib/address";
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
import { AgentPromptForm } from "@/components/profile/AgentPromptForm";
import { useClipboard } from "@/helpers/clipboard-utils";
import { Button } from "@/components/ui/button";
import { getAddressExplorerUrl } from "@/helpers/explorer";
import { TokenBalance } from "@/components/reusables/BalanceDisplay";
import { Badge } from "@/components/ui/badge";

const stacksAddress = getStacksAddress();

export function ProfileView() {
  const {
    data: votes = [],
    isLoading,
    error,
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
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Profile</h1>
                <p className="text-gray-400 mt-1">
                  Manage your account settings and voting history
                </p>
              </div>
              <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-sm px-3 py-1">
                Profile Dashboard
              </Badge>
            </div>
          </div>

          {/* Connected Account Card */}
          <Card className="bg-[#2A2A2A] border-gray-600">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                Connected Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stacksAddress ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0" />

                      {/* Address */}
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-white truncate">
                          {stacksAddress}
                        </p>
                        <p className="text-xs text-gray-400">Stacks Address</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => copyToClipboard(stacksAddress)}
                        className="p-2 hover:bg-gray-700 rounded-md transition-colors"
                        title="Copy address"
                      >
                        {copiedText === stacksAddress ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      <a
                        href={getAddressExplorerUrl(stacksAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-700 rounded-md transition-colors"
                        title="View on explorer"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No wallet connected</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect your wallet to view your profile
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agent Management Card */}
          <Card className="bg-[#2A2A2A] border-gray-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-white">
                  Agent Management
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                      <HistoryIcon className="h-4 w-4 mr-2" />
                      Voting History
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-full max-h-[80vh] overflow-y-auto bg-[#2A2A2A] border-gray-600">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        Voting History
                      </DialogTitle>
                    </DialogHeader>
                    {error && (
                      <div className="text-center py-4 text-red-500">
                        {error instanceof Error
                          ? error.message
                          : "Failed to load voting history"}
                      </div>
                    )}
                    <div className="overflow-x-auto mt-2">
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
                          {votes.length === 0 ? (
                            <TableRow className="border-gray-600">
                              <TableCell
                                colSpan={7}
                                className="text-center py-8 text-gray-400"
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <HistoryIcon className="h-8 w-8 text-gray-500" />
                                  <p>No voting history found</p>
                                  <p className="text-sm text-gray-500">
                                    Your voting activity will appear here
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            votes.map((vote) => (
                              <TableRow
                                key={vote.id}
                                className="border-gray-600"
                              >
                                <TableCell className="text-gray-300">
                                  {vote.dao_name}
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
                                    <span className="flex items-center text-green-500">
                                      <ThumbsUp className="h-4 w-4 mr-1" />
                                      Yes
                                    </span>
                                  ) : (
                                    <span className="flex items-center text-red-500">
                                      <ThumbsDown className="h-4 w-4 mr-1" />
                                      No
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {vote.amount !== null ? (
                                    <TokenBalance
                                      value={vote.amount}
                                      variant="rounded"
                                    />
                                  ) : (
                                    <span className="text-gray-400">
                                      Agent did not vote
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-gray-300">
                                  {formatDistanceToNow(
                                    new Date(vote.created_at),
                                    {
                                      addSuffix: true,
                                    }
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Dialog>
                                      <DialogTrigger className="cursor-pointer text-orange-500 hover:text-orange-400 transition-colors">
                                        <div className="max-w-xs truncate">
                                          {vote.reasoning &&
                                            vote.reasoning
                                              .substring(0, 40)
                                              .replace(/[#*`_~[\]]/g, "")}
                                          {vote.reasoning &&
                                          vote.reasoning.length > 40
                                            ? "..."
                                            : ""}
                                        </div>
                                      </DialogTrigger>
                                      <DialogContent className="w-[80vw] max-w-5xl bg-[#2A2A2A] border-gray-600">
                                        <DialogHeader>
                                          <DialogTitle className="text-white">
                                            Vote Reasoning
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4 prose prose-sm md:prose-base dark:prose-invert max-w-none px-2">
                                          <ReactMarkdown>
                                            {vote.reasoning || ""}
                                          </ReactMarkdown>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    {vote.reasoning && (
                                      <button
                                        onClick={() =>
                                          vote.reasoning &&
                                          copyToClipboard(vote.reasoning)
                                        }
                                        className="p-1 hover:bg-gray-700 rounded-md transition-colors"
                                        title="Copy reasoning"
                                      >
                                        {vote.reasoning &&
                                        copiedText === vote.reasoning ? (
                                          <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <Copy className="h-4 w-4 text-gray-400" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {vote.tx_id ? (
                                    <a
                                      href={`https://explorer.stacks.co/txid/${
                                        vote.tx_id
                                      }?chain=${
                                        process.env
                                          .NEXT_PUBLIC_STACKS_NETWORK ===
                                        "testnet"
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
                                    <span className="text-gray-400">N/A</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <AgentPromptForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
