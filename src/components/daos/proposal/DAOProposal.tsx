"use client";

import { useState } from "react";
import ProposalCard from "@/components/daos/proposal/ProposalCard";
import type { Proposal } from "@/types/supabase";

interface DAOProposalsProps {
  proposals: Proposal[];
  tokenSymbol?: string;
}

const DAOProposals = ({ proposals, tokenSymbol = "" }: DAOProposalsProps) => {
  const [hiddenProposals, setHiddenProposals] = useState<Set<string>>(
    new Set(),
  );

  const toggleProposalVisibility = (proposalId: string) => {
    setHiddenProposals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(proposalId)) {
        newSet.delete(proposalId);
      } else {
        newSet.add(proposalId);
      }
      return newSet;
    });
  };

  const visibleProposals = proposals.filter(
    (proposal) => !hiddenProposals.has(proposal.id),
  );

  const hiddenCount = hiddenProposals.size;

  return (
    <div className="space-y-6">
      {/* Hidden proposals notice */}
      {hiddenCount > 0 && (
        <div className="text-sm text-gray-400 bg-gray-800/30 p-3 rounded-md">
          {hiddenCount} proposal{hiddenCount > 1 ? "s" : ""} hidden
        </div>
      )}

      {/* Visible proposals */}
      {visibleProposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onToggleVisibility={toggleProposalVisibility}
          isHidden={false}
          tokenSymbol={tokenSymbol}
        />
      ))}

      {/* Hidden proposals toggle */}
      {hiddenCount > 0 && (
        <div className="pt-4 border-t border-gray-600">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">
            Hidden Proposals ({hiddenCount})
          </h3>
          {Array.from(hiddenProposals).map((proposalId) => {
            const proposal = proposals.find((p) => p.id === proposalId);
            return proposal ? (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onToggleVisibility={toggleProposalVisibility}
                isHidden={true}
                tokenSymbol={tokenSymbol}
              />
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};



export default DAOProposals;
