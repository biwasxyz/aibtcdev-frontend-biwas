"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader } from "@/components/reusables/Loader";
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
                      <Loader />
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

  return <AllProposals proposals={proposals || []} />;
}
