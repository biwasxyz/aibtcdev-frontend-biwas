"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import DAOProposals from "@/components/daos/dao-proposals";
import { fetchProposals } from "@/queries/daoQueries";
import { Proposal } from "@/types/supabase";

export const runtime = "edge";

export default function ProposalsPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: proposals, isLoading } = useQuery<Proposal[]>({
    queryKey: ["proposals", id],
    queryFn: () => fetchProposals(id),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-0">
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
