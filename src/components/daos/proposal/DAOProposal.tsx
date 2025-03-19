"use client";
import React, { useState, useEffect } from "react";
import { Card, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, Clock, Calendar, FileText } from "lucide-react";
import ProposalCard from "./ProposalCard";
import { Proposal } from "@/types/supabase";
import { Button } from "@/components/ui/button";

interface DAOProposalsProps {
  proposals: Proposal[];
}

type FilterType = "all" | "active" | "created" | "passed" | "failed";

const DAOProposals: React.FC<DAOProposalsProps> = ({ proposals }) => {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filteredProposals, setFilteredProposals] =
    useState<Proposal[]>(proposals);

  // Update filtered proposals when filter changes or proposals change
  useEffect(() => {
    setFilteredProposals(applyFilter(filterType, proposals));
  }, [filterType, proposals]);

  // Filter function
  const applyFilter = (
    type: FilterType,
    proposalList: Proposal[]
  ): Proposal[] => {
    switch (type) {
      case "active":
        return proposalList.filter((p) => {
          // Check if proposal is in voting period
          const now = new Date();
          const hasStarted = p.start_block > 0;
          const hasNotEnded = p.status !== "DEPLOYED" && p.status !== "FAILED";
          return hasStarted && hasNotEnded;
        });

      case "created":
        // Recently created proposals (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return proposalList
          .filter((p) => new Date(p.created_at) >= sevenDaysAgo)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

      case "passed":
        return proposalList.filter((p) => p.passed);

      case "failed":
        return proposalList.filter(
          (p) => p.status === "FAILED" || (p.status === "DEPLOYED" && !p.passed)
        );

      default:
        return proposalList;
    }
  };

  // Get icon component for each filter type
  const getFilterIcon = (type: FilterType) => {
    switch (type) {
      case "active":
        return Clock;
      case "created":
        return Calendar;
      case "passed":
        return Check;
      case "failed":
        return X;
      default:
        return FileText;
    }
  };

  // Get human-readable label for the filter
  const getFilterLabel = (type: FilterType): string => {
    switch (type) {
      case "all":
        return "All Proposals";
      case "active":
        return "Active Voting";
      case "created":
        return "Recently Created";
      case "passed":
        return "Passed";
      case "failed":
        return "Failed";
      default:
        return "All";
    }
  };

  // Get current filter icon component
  const CurrentFilterIcon = getFilterIcon(filterType);

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

            {/* Desktop view: Filter buttons */}
            <div className="hidden sm:flex flex-wrap items-center gap-2">
              {["all", "active", "created", "passed", "failed"].map((type) => {
                const FilterIcon = getFilterIcon(type as FilterType);
                const isActive = filterType === type;

                return (
                  <Button
                    key={type}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`gap-2 ${
                      isActive
                        ? "bg-zinc-700 text-white"
                        : "bg-zinc-900 text-muted-foreground"
                    }`}
                    onClick={() => setFilterType(type as FilterType)}
                  >
                    <FilterIcon className="h-4 w-4" />
                    <span>{getFilterLabel(type as FilterType)}</span>
                  </Button>
                );
              })}
            </div>

            {/* Mobile view: Dropdown */}
            <div className="sm:hidden w-full">
              <Select
                value={filterType}
                onValueChange={(value) => setFilterType(value as FilterType)}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <CurrentFilterIcon className="h-4 w-4" />
                    <SelectValue placeholder="Filter proposals" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Proposals</SelectItem>
                  <SelectItem value="active">Active Voting</SelectItem>
                  <SelectItem value="created">Recently Created</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter count indicator */}
          <div className="text-sm text-muted-foreground">
            {filteredProposals.length} proposals found
          </div>

          {filteredProposals.length === 0 ? (
            <Card className="p-8 text-center">
              <CardDescription>
                No proposals match the selected filter.
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
