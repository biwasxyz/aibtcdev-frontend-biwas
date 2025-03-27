"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import DAOProposals from "@/components/daos/proposal/DAOProposal";
import { fetchProposals } from "@/queries/daoQueries";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export const runtime = "edge";

export default function ProposalsPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    data: proposals,
    isLoading,
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["proposals", id],
    queryFn: () => fetchProposals(id),
    staleTime: 1000000,
  });

  const lastUpdated = dataUpdatedAt
    ? format(dataUpdatedAt, "HH:mm:ss")
    : "never";

  const handleRefetch = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-0">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefetch}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[200px] w-full">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <DAOProposals proposals={proposals || []} />
      </Suspense>
    </div>
  );
}
