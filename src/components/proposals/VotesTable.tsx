"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProposalVotes, type Vote } from "@/queries/vote-queries";
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
import CopyButton from "@/components/proposals/CopyButton";

interface VotesTableProps {
  proposalId: string;
}

const VotesTable = ({ proposalId }: VotesTableProps) => {
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

  // Note: Realtime updates are now handled globally by SupabaseRealtimeProvider

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-2 p-3 rounded-md">
        <div className="h-3 sm:h-4 bg-muted rounded-full animate-pulse w-full"></div>
        <div className="h-3 sm:h-4 bg-muted rounded-full animate-pulse w-5/6"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive p-3 text-center rounded-md text-sm">
        Error loading votes: {error?.message || "Unknown error"}
      </div>
    );
  }

  // --- Empty State ---
  if (!votes || votes.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground rounded-md text-sm">
        No votes have been recorded for this proposal yet.
      </div>
    );
  }

  // --- Helper function for confidence bar color ---
  const getConfidenceColor = (confidence: number | null): string => {
    if (confidence === null) return "bg-gray-600";
    if (confidence >= 0.8) return "bg-orange-500";
    if (confidence >= 0.6) return "bg-orange-500/80";
    if (confidence >= 0.4) return "bg-orange-500/60";
    if (confidence >= 0.2) return "bg-orange-500/40";
    return "bg-gray-500";
  };

  // --- Render Votes Table ---
  return (
    <div className="overflow-x-auto relative rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-primary font-medium">
              Vote
            </TableHead>
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-primary font-medium">
              Confidence
            </TableHead>
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-primary font-medium">
              Reasoning
            </TableHead>
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-primary font-medium">
              TX
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {votes.map((vote) => (
            <TableRow key={vote.id}>
              {/* Vote Yes/No */}
              <TableCell className="px-2 py-1.5 text-xs">
                {vote.tx_id ? (
                  vote.answer ? (
                    <span className="flex items-center text-orange-500 font-medium">
                      <ThumbsUp className="h-3 w-3 mr-1 flex-shrink-0" />
                      Yes
                    </span>
                  ) : (
                    <span className="flex items-center text-blue-400 font-medium">
                      <ThumbsDown className="h-3 w-3 mr-1 flex-shrink-0" />
                      No
                    </span>
                  )
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </TableCell>

              {/* Confidence */}
              <TableCell className="px-2 py-1.5 text-xs">
                {vote.confidence !== null ? (
                  <div
                    className="flex items-center"
                    title={`Confidence: ${Math.round(vote.confidence * 100)}%`}
                  >
                    <div className="w-12 h-1.5 bg-gray-700 rounded-full mr-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 ${getConfidenceColor(
                          vote.confidence,
                        )}`}
                        style={{ width: `${vote.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="tabular-nums text-orange-500 font-medium">
                      {Math.round(vote.confidence * 100)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </TableCell>

              {/* Reasoning */}
              <TableCell className="px-2 py-1.5 text-xs">
                {vote.reasoning ? (
                  <div className="flex items-center gap-1 max-w-xs">
                    <Dialog>
                      <DialogTrigger className="cursor-pointer text-orange-500 hover:text-orange-400 hover:underline truncate text-left">
                        {(vote.reasoning || "")
                          .substring(0, 30)
                          .replace(/[#*`_~[\]()]/g, "")}
                        {(vote.reasoning || "").length > 30 ? "..." : ""}
                      </DialogTrigger>
                      <DialogContent className="w-[90vw] sm:w-[80vw] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle>Vote Reasoning</DialogTitle>
                        </DialogHeader>
                        <div className="mt-3 prose prose-sm dark:prose-invert max-w-none px-1 overflow-y-auto flex-1 prose-p:my-2 prose-li:my-1">
                          <ReactMarkdown>{vote.reasoning || ""}</ReactMarkdown>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <CopyButton text={vote.reasoning || ""} />
                  </div>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </TableCell>

              {/* TX Link */}
              <TableCell className="px-2 py-1.5 text-center text-xs">
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
                    className="text-orange-500 hover:text-orange-400 inline-block"
                    title={`View transaction ${vote.tx_id}`}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-gray-500">-</span>
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
