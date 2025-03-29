"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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

const stacksAddress = getStacksAddress();

export function ProfileView() {
  // Using useQuery instead of useState + useEffect
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Wallet Information */}
        <Card className="border-none shadow-none bg-background/40 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base sm:text-2xl font-medium">
              Wallet Information
            </CardTitle>
            <Separator className="my-2" />
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Connected Wallet
              </label>
              <div className="font-mono text-sm bg-muted/30 p-2 rounded-md">
                {stacksAddress}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Voting History */}
        <Card className="border-none shadow-none bg-background/40 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base sm:text-2xl font-medium">
              Voting History
            </CardTitle>
            <Separator className="my-2" />
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-4 text-red-500">
                {error instanceof Error
                  ? error.message
                  : "Failed to load voting history"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Agent</TableHead>
                      <TableHead className="whitespace-nowrap">DAO</TableHead>
                      <TableHead className="whitespace-nowrap">
                        Proposal
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Vote</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">
                        Reasoning
                      </TableHead>
                      <TableHead className="whitespace-nowrap">TX</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {votes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No voting history found
                        </TableCell>
                      </TableRow>
                    ) : (
                      votes.map((vote) => (
                        <TableRow key={vote.id}>
                          <TableCell className="font-medium">
                            {vote.agent_name}
                          </TableCell>
                          <TableCell>{vote.dao_name}</TableCell>
                          <TableCell>
                            <div
                              className="max-w-xs truncate"
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
                          <TableCell className="whitespace-nowrap">
                            {formatDistanceToNow(new Date(vote.created_at), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger className="cursor-pointer text-primary hover:underline">
                                <div className="max-w-xs truncate">
                                  {vote.reasoning.substring(0, 40)}
                                  {vote.reasoning.length > 40 ? "..." : ""}
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Vote Reasoning</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  <p className="text-sm">{vote.reasoning}</p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                          <TableCell>
                            {vote.tx_id ? (
                              <a
                                href={`https://explorer.stacks.co/txid/${
                                  vote.tx_id
                                }?chain=${
                                  process.env.NEXT_PUBLIC_STACKS_NETWORK ===
                                  "testnet"
                                    ? "testnet"
                                    : "mainnet"
                                }`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
