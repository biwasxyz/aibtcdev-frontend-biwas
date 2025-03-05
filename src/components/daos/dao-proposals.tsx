"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Proposal } from "@/types/supabase";
import {
  Timer,
  CheckCircle2,
  FileEdit,
  XCircle,
  Link as LinkIcon,
  Filter,
  Hash,
  Wallet,
  UserCircle,
  Target,
  Clock,
  Blocks,
  ExternalLink,
} from "lucide-react";

interface DAOProposalsProps {
  proposals: Proposal[];
}

const StatusBadge = ({ status }: { status: Proposal["status"] }) => {
  const config = {
    DRAFT: {
      color: "bg-gray-500/10 text-gray-500",
      icon: FileEdit,
      label: "Draft",
    },
    PENDING: {
      color: "bg-blue-500/10 text-blue-500",
      icon: Timer,
      label: "Pending",
    },
    DEPLOYED: {
      color: "bg-green-500/10 text-green-500",
      icon: CheckCircle2,
      label: "Deployed",
    },
    FAILED: {
      color: "bg-red-500/10 text-red-500",
      icon: XCircle,
      label: "Failed",
    },
  };

  const { color, icon: Icon, label } = config[status];

  return (
    <Badge variant="secondary" className={`${color} text-xs sm:text-sm`}>
      <span className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
        {label}
      </span>
    </Badge>
  );
};

const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const truncateString = (str: string, length: number) => {
    if (!str) return "";
    return str.length <= length ? str : `${str.substring(0, length)}...`;
  };

  const getTxLink = () => {
    const baseUrl = "http://explorer.hiro.so/txid/";
    const chainParam =
      process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
        ? "?chain=testnet"
        : "";
    return `${baseUrl}${proposal.tx_id}${chainParam}`;
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              {proposal.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {proposal.description}
            </p>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Created: {format(new Date(proposal.created_at), "PPp")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Blocks className="h-4 w-4" />
                <span>Created at Block: {proposal.created_at_block}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Start Block: {proposal.start_block}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>End Block: {proposal.end_block}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCircle className="h-4 w-4" />
                <span>Creator: {truncateString(proposal.creator, 20)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCircle className="h-4 w-4" />
                <span>Caller: {truncateString(proposal.caller, 20)}</span>
              </div>
              {proposal.liquid_tokens !== null && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  <span>Liquid Tokens: {proposal.liquid_tokens}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span className="font-mono">
                Proposal ID: {proposal.proposal_id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span className="font-mono">
                TX ID:
                <a
                  href={getTxLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 hover:text-blue-600 inline-flex items-center"
                >
                  {proposal.tx_id}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="font-mono">
                Principal: {proposal.contract_principal}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="font-mono">Action: {proposal.action}</span>
            </div>
          </div>

          {proposal.parameters && (
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <h4 className="font-semibold mb-2">Parameters</h4>
              <p className="overflow-x-auto whitespace-pre-wrap break-words">
                {proposal.parameters}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function DAOProposals({ proposals }: DAOProposalsProps) {
  const [statusFilter, setStatusFilter] = useState<Proposal["status"] | "all">(
    "all"
  );

  const filteredProposals = proposals.filter(
    (proposal) => statusFilter === "all" || proposal.status === statusFilter
  );

  const stats = {
    active: proposals.filter((p) => p.status === "DEPLOYED").length,
    total: proposals.length,
    successRate: (() => {
      const totalNonDeployedProposals = proposals.filter(
        (p) => p.status !== "DEPLOYED"
      ).length;

      // If no proposals or no non-deployed proposals, return 0 or 100
      if (proposals.length === 0) return 0;
      if (totalNonDeployedProposals === 0) return 100;

      // Calculate success rate
      return Math.round(
        (proposals.filter((p) => p.status === "DEPLOYED").length /
          totalNonDeployedProposals) *
          100
      );
    })(),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <CardHeader className="p-0">
            <h3 className="text-sm font-medium text-muted-foreground">
              Active Proposals
            </h3>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="p-6">
          <CardHeader className="p-0">
            <h3 className="text-sm font-medium text-muted-foreground">
              Success Rate
            </h3>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="text-2xl font-bold">{stats.successRate}%</div>
          </CardContent>
        </Card>
        <Card className="p-6">
          <CardHeader className="p-0">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Proposals
            </h3>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Proposals</h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
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

      <div className="grid gap-4">
        {filteredProposals.map((proposal) => (
          <ProposalCard key={proposal.id} proposal={proposal} />
        ))}
      </div>
    </div>
  );
}

export { DAOProposals };
export default DAOProposals;
