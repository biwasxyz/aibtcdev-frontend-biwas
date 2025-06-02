"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProposalWithDAO } from "@/types/supabase";
import { fetchProposalById } from "@/queries/dao-queries";
import ProposalDetails from "@/components/daos/proposal/ProposalDetails";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useVotingStatus } from "@/components/daos/proposal/TimeStatus";
import { safeNumberFromBigInt, safeString } from "@/helpers/proposal-utils";
import { format } from "date-fns";
import Link from "next/link";
import { getExplorerLink } from "@/helpers/helper";

export const runtime = "edge";

export default function ProposalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<ProposalWithDAO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isActive, isEnded } = useVotingStatus(
    proposal?.status || "",
    safeNumberFromBigInt(proposal?.vote_start || BigInt(0)),
    safeNumberFromBigInt(proposal?.vote_end || BigInt(0)),
  );

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const proposalId = params.id as string;
        const data = await fetchProposalById(proposalId);
        setProposal(data);
      } catch (error) {
        console.error("Error fetching proposal:", error);
        setError("Failed to load proposal");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProposal();
    }
  }, [params.id]);

  const getStatusBadge = () => {
    if (!proposal) return null;
    
    if (isActive) {
      return (
        <Badge className="bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 border-orange-500/50">
          Active
        </Badge>
      );
    } else if (isEnded && proposal.passed) {
      return (
        <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50">
          Passed
        </Badge>
      );
    } else if (isEnded && !proposal.passed) {
      return (
        <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50">
          Failed
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500/20 text-gray-500 hover:bg-gray-500/30 border-gray-500/50">
          Pending
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="h-full flex items-center justify-center text-sm text-zinc-500">
          Loading proposal...
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="container mx-auto p-4">
        <div className="h-full flex items-center justify-center text-sm text-zinc-500">
          {error || "Proposal not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header Section */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-zinc-700 flex-shrink-0" />
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {proposal.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {proposal.daos?.name && (
                    <>
                      <Link
                        href={`/daos/${encodeURIComponent(proposal.daos.name)}`}
                        className="hover:text-white transition-colors flex items-center gap-1"
                      >
                        {proposal.daos.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <span>•</span>
                    </>
                  )}
                  <span>
                    Created {format(new Date(proposal.created_at), "MMM dd, yyyy")}
                  </span>
                  <span>•</span>
                  <a
                    href={getExplorerLink("address", proposal.creator)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    By {safeString(proposal.creator).slice(0, 6)}...{safeString(proposal.creator).slice(-4)}
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Category badge if available */}
        {proposal.type && (
          <div className="mb-4">
            <Badge
              variant="outline"
              className="text-purple-400 border-purple-400/50"
            >
              {proposal.type}
            </Badge>
          </div>
        )}
      </div>

      {/* Proposal Details */}
      <ProposalDetails proposal={proposal} />
    </div>
  );
} 