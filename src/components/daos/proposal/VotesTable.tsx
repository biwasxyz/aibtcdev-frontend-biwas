"use client";

import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProposalVotes, type Vote } from "@/queries/vote-queries";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";
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
import ReactMarkdown from "react-markdown";
import CopyButton from "./CopyButton";
import { TokenBalance } from "@/components/reusables/balance-display";
import { supabase } from "@/utils/supabase/client";

interface VotesTableProps {
  proposalId: string;
}

const VotesTable: React.FC<VotesTableProps> = ({ proposalId }) => {
  const queryClient = useQueryClient();
  const {
    data: votes,
    isLoading,
    error,
    isError,
  } = useQuery<Vote[], Error>({
    queryKey: ["proposalVotesTable", proposalId],
    queryFn: () => fetchProposalVotes(proposalId),
    enabled: !!proposalId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 1, // 1 minute stale time
    gcTime: 1000 * 60 * 5, // 5 minutes garbage collection time
  });

  useEffect(() => {
    if (!proposalId) return;

    // Subscribe to changes on the votes table for this proposal
    const channel = supabase
      .channel("votes-table-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "votes",
          filter: `proposal_id=eq.${proposalId}`,
        },
        () => {
          // Invalidate or refetch the query to get fresh data
          queryClient.invalidateQueries({
            queryKey: ["proposalVotesTable", proposalId],
          });
        }
      )
      .subscribe();

    // Cleanup on unmount or proposalId change
    return () => {
      supabase.removeChannel(channel);
    };
  }, [proposalId, queryClient]);

  // --- Loading State ---
  if (isLoading) {
    return (
      // Simple skeleton loader for the table body area
      <div className="space-y-2 p-4 border border-zinc-700/50 rounded-lg bg-zinc-800/30">
        <div className="h-4 bg-zinc-700 rounded-full animate-pulse w-full"></div>
        <div className="h-4 bg-zinc-700 rounded-full animate-pulse w-5/6"></div>
        <div className="h-4 bg-zinc-700 rounded-full animate-pulse w-full"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-400 p-4 text-center border border-red-700/50 rounded-lg bg-red-900/10">
        Error loading votes: {error?.message || "Unknown error"}
      </div>
    );
  }

  // --- Empty State ---
  if (!votes || votes.length === 0) {
    return (
      <div className="py-6 text-center text-muted-foreground bg-zinc-800/50 rounded-lg border border-zinc-700/50">
        No votes have been recorded for this proposal yet.
      </div>
    );
  }

  // --- Helper function for confidence bar color ---
  const getConfidenceColor = (confidence: number | null): string => {
    if (confidence === null) return "bg-gray-500 dark:bg-gray-600"; // More distinct null color
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-green-400";
    if (confidence >= 0.4) return "bg-yellow-400";
    if (confidence >= 0.2) return "bg-orange-500";
    return "bg-red-500";
  };

  // --- Render Votes Table ---
  return (
    <div className="overflow-x-auto relative border border-zinc-700/50 rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-800/30 hover:bg-zinc-800/50">
            <TableHead className="whitespace-nowrap px-3 py-2 text-muted-foreground">
              Vote
            </TableHead>
            {/* Optional: <TableHead>Voter</TableHead> */}
            <TableHead className="whitespace-nowrap px-3 py-2 text-muted-foreground">
              Amount
            </TableHead>
            <TableHead className="whitespace-nowrap px-3 py-2 text-muted-foreground">
              Date
            </TableHead>
            <TableHead className="whitespace-nowrap px-3 py-2 text-muted-foreground">
              Confidence
            </TableHead>
            <TableHead className="whitespace-nowrap px-3 py-2 text-muted-foreground">
              Reasoning
            </TableHead>
            <TableHead className="whitespace-nowrap px-3 py-2 text-muted-foreground">
              Prompt
            </TableHead>
            <TableHead className="whitespace-nowrap px-3 py-2 text-center text-muted-foreground">
              TX
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {votes.map((vote) => (
            <TableRow
              key={vote.id}
              className="hover:bg-zinc-800/40 border-b border-zinc-700/50 last:border-b-0"
            >
              {/* Vote Yes/No */}
              <TableCell className="px-3 py-2">
                {vote.amount === null ? (
                  <span className="flex items-center text-zinc-500">
                    <span className="h-4 w-4 mr-1.5 flex-shrink-0 rounded-full border border-zinc-500"></span>
                    No vote
                  </span>
                ) : vote.answer ? (
                  <span className="flex items-center text-green-400">
                    <ThumbsUp className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    Yes
                  </span>
                ) : (
                  <span className="flex items-center text-red-400">
                    <ThumbsDown className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    No
                  </span>
                )}
              </TableCell>

              {/* Amount */}
              <TableCell className="whitespace-nowrap px-3 py-2">
                {vote.amount !== null ? (
                  <TokenBalance
                    value={vote.amount}
                    decimals={8}
                    variant="rounded"
                  />
                ) : (
                  <span className="text-muted-foreground">
                    Agent did not vote
                  </span>
                )}
              </TableCell>

              {/* Date */}
              <TableCell className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(vote.created_at), {
                  addSuffix: true,
                })}
              </TableCell>

              {/* Confidence */}
              <TableCell className="px-3 py-2">
                {vote.confidence !== null ? (
                  <div
                    className="flex items-center"
                    title={`Confidence: ${Math.round(vote.confidence * 100)}%`}
                  >
                    <div className="w-16 h-2 bg-zinc-700 rounded-full mr-2 overflow-hidden">
                      <div
                        className={`h-2 ${getConfidenceColor(vote.confidence)}`}
                        style={{ width: `${vote.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs tabular-nums">
                      {Math.round(vote.confidence * 100)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>

              {/* Reasoning (Corrected for null) */}
              <TableCell className="px-3 py-2">
                {vote.reasoning ? (
                  <div className="flex items-center gap-1 max-w-xs">
                    <Dialog>
                      <DialogTrigger className="cursor-pointer text-primary hover:underline truncate text-left">
                        {(vote.reasoning || "")
                          .substring(0, 40)
                          .replace(/[#*`_~[\]()]/g, "")}
                        {(vote.reasoning || "").length > 40 ? "..." : ""}
                      </DialogTrigger>
                      <DialogContent className="w-[90vw] sm:w-[80vw] max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle>Vote Reasoning</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 prose prose-sm md:prose-base dark:prose-invert max-w-none px-1 overflow-y-auto flex-1 prose-p:my-2 prose-li:my-1">
                          <ReactMarkdown>{vote.reasoning || ""}</ReactMarkdown>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {/* Pass empty string if reasoning is null */}
                    <CopyButton text={vote.reasoning || ""} />
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>

              {/* Prompt (Corrected for null) */}
              <TableCell className="px-3 py-2">
                {vote.prompt ? (
                  <div className="flex items-center gap-1 max-w-xs">
                    <Dialog>
                      <DialogTrigger className="cursor-pointer text-primary hover:underline truncate text-left">
                        {(vote.prompt || "")
                          .substring(0, 40)
                          .replace(/[#*`_~[\]()]/g, "")}
                        {(vote.prompt || "").length > 40 ? "..." : ""}
                      </DialogTrigger>
                      <DialogContent className="w-[90vw] sm:w-[80vw] max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle>Vote Prompt</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 prose prose-sm md:prose-base dark:prose-invert max-w-none px-1 overflow-y-auto flex-1 prose-p:my-2 prose-li:my-1">
                          <ReactMarkdown>{vote.prompt || ""}</ReactMarkdown>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {/* Pass empty string if prompt is null */}
                    <CopyButton text={vote.prompt || ""} />
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>

              {/* TX Link */}
              <TableCell className="px-3 py-2 text-center">
                {vote.tx_id ? (
                  <a
                    href={`https://explorer.stacks.co/txid/${
                      vote.tx_id
                    }?chain=${
                      process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
                        ? "testnet"
                        : "mainnet"
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 inline-block"
                    title={`View transaction ${vote.tx_id}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VotesTable;
