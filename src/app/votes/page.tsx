"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader } from "@/components/reusables/Loader";
import { VotesView } from "@/components/votes/VotesView";
import { fetchVotes } from "@/queries/vote-queries";
import { supabase } from "@/utils/supabase/client";
import React from "react";

export const runtime = "edge";

export default function VotesPage() {
  const queryClient = useQueryClient();

  // Fetch all votes
  const {
    data: votes,
    isLoading,
    error: votesError,
  } = useQuery({
    queryKey: ["votes"],
    queryFn: () => fetchVotes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Add error handling
  if (votesError) {
    console.error("Error fetching votes:", votesError);
  }

  // Supabase Realtime subscription for votes table changes
  React.useEffect(() => {
    const channel = supabase
      .channel("votes-table-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "votes",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["votes"] });
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
  if (votesError) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Error Loading Votes
          </h2>
          <p className="text-muted-foreground">
            Failed to load votes. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return <VotesView votes={votes || []} />;
} 