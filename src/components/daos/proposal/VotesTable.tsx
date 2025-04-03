"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProposalVotes } from "@/queries/vote-queries";
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

interface VotesTableProps {
  proposalId: string;
  refreshing?: boolean;
}

const VotesTable: React.FC<VotesTableProps> = ({
  proposalId,
  refreshing = false,
}) => {
  // Use React Query to fetch and cache votes
  const {
    data: votes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["proposalVotesTable", proposalId, refreshing],
    queryFn: () => fetchProposalVotes(proposalId),
    enabled: !!proposalId,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">Error: {(error as Error).message}</div>
    );
  }

  if (!votes || votes.length === 0) {
    return (
      <div className="py-4 text-center bg-zinc-800 rounded-lg">
        No votes recorded yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Vote</TableHead>
            <TableHead className="whitespace-nowrap">Date</TableHead>
            <TableHead className="whitespace-nowrap">Reasoning</TableHead>
            <TableHead className="whitespace-nowrap">Prompt</TableHead>
            <TableHead className="whitespace-nowrap">TX</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {votes.map((vote) => (
            <TableRow key={vote.id}>
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
                      {vote.reasoning
                        .substring(0, 40)
                        .replace(/[#*`_~[\]]/g, "")}
                      {vote.reasoning.length > 40 ? "..." : ""}
                    </div>
                  </DialogTrigger>
                  <DialogContent className="w-[80vw] max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Vote Reasoning</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 prose prose-sm md:prose-base dark:prose-invert max-w-none px-2 overflow-y-auto flex-1">
                      <ReactMarkdown>{vote.reasoning}</ReactMarkdown>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
              <TableCell>
                {vote.prompt ? (
                  <Dialog>
                    <DialogTrigger className="cursor-pointer text-primary hover:underline">
                      <div className="max-w-xs truncate">
                        {vote.prompt
                          .substring(0, 40)
                          .replace(/[#*`_~[\]]/g, "")}
                        {vote.prompt.length > 40 ? "..." : ""}
                      </div>
                    </DialogTrigger>
                    <DialogContent className="w-[80vw] max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Vote Prompt</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4 prose prose-sm md:prose-base dark:prose-invert max-w-none px-2 overflow-y-auto flex-1">
                        <ReactMarkdown>{vote.prompt}</ReactMarkdown>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
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
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
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
