"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import DAOExtensions from "@/components/daos/dao-extensions";
import { fetchDAOExtensions } from "@/queries/daoQueries";
import { Loader } from "@/components/reusables/loader";

export const runtime = "edge";

export default function ExtensionsPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: daoExtensions, isLoading } = useQuery({
    queryKey: ["daoExtensions", id],
    queryFn: () => fetchDAOExtensions(id),
    staleTime: 600000, // 10 minutes
  });

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {daoExtensions && daoExtensions.length > 0 && (
        <DAOExtensions extensions={daoExtensions} />
      )}
    </div>
  );
}
