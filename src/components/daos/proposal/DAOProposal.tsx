"use client";
import { useEffect, useRef } from "react";
import type React from "react";
import { Card, CardDescription } from "@/components/ui/card";
import ProposalCard from "./ProposalCard";
import type { Proposal } from "@/types/supabase";

interface DAOProposalsProps {
  proposals: Proposal[];
}

const DAOProposals: React.FC<DAOProposalsProps> = ({ proposals }) => {
  const proposalsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to proposals section when component mounts
    if (proposalsRef.current) {
      proposalsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold">Proposals</h2>
          <p className="mt-2">
            View and manage your DAO&apos;s governance proposals.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"></div>
        <div ref={proposalsRef} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">All Proposals</h3>
          </div>
          {proposals.length === 0 ? (
            <Card className="p-8 text-center">
              <CardDescription>No proposals found.</CardDescription>
            </Card>
          ) : (
            <div className="grid gap-6">
              {proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DAOProposals;
