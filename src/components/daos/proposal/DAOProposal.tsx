// File: src/components/DAOProposals.tsx
"use client";
import React, { useState } from "react";
import { Card, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import ProposalCard from "./ProposalCard";
import { Proposal } from "@/types/supabase";

interface DAOProposalsProps {
  proposals: Proposal[];
}

const DAOProposals: React.FC<DAOProposalsProps> = ({ proposals }) => {
  const [statusFilter, setStatusFilter] = useState<Proposal["status"] | "all">(
    "all"
  );
  const filteredProposals = proposals.filter(
    (proposal) => statusFilter === "all" || proposal.status === statusFilter
  );

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
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">All Proposals</h3>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as Proposal["status"] | "all")
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Proposals</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="DEPLOYED">Deployed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {filteredProposals.length === 0 ? (
            <Card className="p-8 text-center">
              <CardDescription>
                No proposals found with the selected filter.
              </CardDescription>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredProposals.map((proposal) => (
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
