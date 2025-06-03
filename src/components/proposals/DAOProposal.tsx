"use client";

import { useState } from "react";
import ProposalCard from "@/components/proposals/ProposalCard";
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
    <div className="space-y-8">
      {/* Hidden proposals notice */}
      {hiddenCount > 0 && (
        <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border">
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
        <div className="pt-6 border-t border-border">
          <h3 className="text-xl font-semibold mb-6 text-foreground">
            Hidden Proposals ({hiddenCount})
          </h3>
          <div className="space-y-6">
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
        </div>
      )}
    </div>
  );
};



export default DAOProposals;
