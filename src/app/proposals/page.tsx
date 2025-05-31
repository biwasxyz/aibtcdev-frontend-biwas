"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AllProposals from "@/components/daos/proposal/AllProposals";
import { fetchAllProposals } from "@/queries/dao-queries";
import { supabase } from "@/utils/supabase/client";
import React from "react";

export const runtime = "edge";

export default function AllProposalsPage() {
  const queryClient = useQueryClient();

  // Fetch all proposals across all DAOs
  const {
    data: proposals,
    isLoading,
    error: proposalsError,
  } = useQuery({
    queryKey: ["allProposals"],
    queryFn: () => fetchAllProposals(),
    staleTime: 1000000,
  });

  // Add error handling
  if (proposalsError) {
    console.error("Error fetching all proposals:", proposalsError);
  }

  // Supabase Realtime subscription for proposals table changes
  React.useEffect(() => {
    const channel = supabase
      .channel("all-proposals-table-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "proposals",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["allProposals"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Add error state
  if (proposalsError) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Error Loading Proposals
          </h2>
          <p className="text-muted-foreground">
            Failed to load proposals. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#1A1A1A] min-h-screen">
      <div className="w-full py-4 flex-grow">
        {/* Header Section */}
        <div className="mb-8 px-4 max-w-7xl mx-auto">
          <div className="bg-[#2A2A2A] rounded-lg p-6 space-y-4">
            <h1 className="text-3xl font-bold text-white">All DAO Proposals</h1>
            <p className="text-gray-300">
              View all proposals across all DAOs in one place.
            </p>
          </div>
        </div>

        {/* Content */}
        <main className="w-full mb-6 px-4 max-w-7xl mx-auto">
          <Suspense
            fallback={
              <div className="flex justify-center items-center min-h-[200px] w-full">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <AllProposals proposals={proposals || []} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
