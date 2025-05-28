"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import DAOHolders from "@/components/daos/dao-holders";
import {
  fetchToken,
  fetchHolders,
  fetchDAOByName,
} from "@/queries/dao-queries";

export const runtime = "edge";

export default function HoldersPage() {
  const params = useParams();
  const encodedName = params.name as string;
  const decodedName = decodeURIComponent(encodedName);
  // console.log(decodedName);

  // First, fetch the DAO by name to get its ID
  const { data: dao, isLoading: isLoadingDAO } = useQuery({
    queryKey: ["dao", decodedName],
    queryFn: () => fetchDAOByName(decodedName),
  });

  const daoId = dao?.id;
  console.log(daoId);

  // Then use the ID to fetch the token
  const { data: token, isLoading: isLoadingToken } = useQuery({
    queryKey: ["token", daoId],
    queryFn: () => (daoId ? fetchToken(daoId) : null),
    staleTime: 600000, // 10 minutes
    enabled: !!daoId, // Only run this query when we have the daoId
  });

  // Finally fetch the holders using the token data
  const { data: holdersData, isLoading: isLoadingHolders } = useQuery({
    queryKey: ["holders", token?.contract_principal, token?.symbol],
    queryFn: () => fetchHolders(token!.contract_principal, token!.symbol),
    enabled: !!token?.contract_principal && !!token?.symbol,
  });

  // console.log(token?.id);
  // console.log(token?.symbol);
  // console.log(token?.contract_principal);

  const isLoading = isLoadingDAO || isLoadingToken || isLoadingHolders;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <DAOHolders
        holders={holdersData?.holders || []}
        tokenSymbol={token?.symbol || ""}
      />
    </div>
  );
}
