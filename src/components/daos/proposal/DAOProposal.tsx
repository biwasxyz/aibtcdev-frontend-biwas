// File: src/components/DAOProposals.tsx
"use client";
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, CheckCircle2, Timer } from "lucide-react";
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
  const stats = {
    active: proposals.filter((p) => p.status === "DEPLOYED").length,
    pending: proposals.filter((p) => p.status === "PENDING").length,
    draft: proposals.filter((p) => p.status === "DRAFT").length,
    failed: proposals.filter((p) => p.status === "FAILED").length,
    total: proposals.length,
    successRate: (() => {
      const completed = proposals.filter(
        (p) => p.status === "DEPLOYED" || p.status === "FAILED"
      );
      if (completed.length === 0) return 0;
      return Math.round(
        (proposals.filter((p) => p.status === "DEPLOYED").length /
          completed.length) *
          100
      );
    })(),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold">Proposals</h2>
          <p className="mt-2">
            View and manage your DAO&apos;s governance proposals.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">Active Proposals</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">{stats.active}</div>
                <Badge
                  variant="secondary"
                  className="ml-2 bg-primary/10 text-primary"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Deployed
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">Pending Proposals</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">{stats.pending}</div>
                <Badge
                  variant="secondary"
                  className="ml-2 bg-primary/10 text-primary"
                >
                  <Timer className="h-4 w-4 mr-1" />
                  Pending
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">Success Rate</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats.successRate}%</div>
                {/* Additional tooltip info can be added here */}
              </div>
              <div className="w-full h-2 bg-secondary/10 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${stats.successRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">Total Proposals</h3>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  {stats.draft} drafts
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats.pending} pending
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats.failed} failed
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
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
