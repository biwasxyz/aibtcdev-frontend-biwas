"use client";

import { useState } from "react";
import { deserializeCV, cvToString } from "@stacks/transactions";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import type { Proposal } from "@/types/supabase";
import {
  Timer,
  CheckCircle2,
  FileEdit,
  XCircle,
  Filter,
  Hash,
  Wallet,
  Calendar,
  User,
  Activity,
  Layers,
  ArrowRight,
  Copy,
  CheckIcon,
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

const truncateString = (
  str: string,
  startLength: number,
  endLength: number
) => {
  if (!str) return "";
  if (str.length <= startLength + endLength) return str;
  return `${str.slice(0, startLength)}...${str.slice(-endLength)}`;
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckIcon className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      <span className="sr-only">Copy to clipboard</span>
    </Button>
  );
};

const BlockVisual = ({
  value,
  type = "stacks",
}: {
  value: number | null;
  type?: "stacks" | "bitcoin";
}) => {
  if (value === null) return <span>N/A</span>;

  // Define colors based on block type
  const color = type === "stacks" ? "bg-orange-500" : "bg-yellow-500";

  const icon =
    type === "stacks" ? (
      <div className={`w-2 h-2 rounded-sm ${color} mr-1.5`} />
    ) : (
      <div className={`w-2 h-2 rounded-full ${color} mr-1.5`} />
    );

  const label = type === "stacks" ? "STX" : "BTC";

  return (
    <div className="flex items-center">
      {icon}
      <span className="text-xs">{value.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground ml-1">{label}</span>
    </div>
  );
};

const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
  const getEstimatedEndDate = (createdAt: string): Date => {
    const start = new Date(createdAt);
    return new Date(start.getTime() + 24 * 60 * 60 * 1000);
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
      <CardContent className="space-y-6">
        {/* Overview Section */}
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                Created: {format(new Date(proposal.created_at), "PPp")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4 flex-shrink-0" />
              <span>
                Ends: {format(getEstimatedEndDate(proposal.created_at), "PPp")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="break-all">
                Creator: {truncateString(proposal.creator, 8, 8)}
              </span>
              <CopyButton text={proposal.creator} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4 flex-shrink-0" />
              <span className="break-all">
                Action: {truncateString(proposal.action, 8, 8)}
              </span>
            </div>
            {proposal.parameters && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground mb-2"></div>
                <div className="space-y-4">
                  <div className="bg-muted/50 p-3 rounded-md text-xs">
                    <div className="whitespace-pre-wrap break-words overflow-x-auto">
                      {(() => {
                        try {
                          if (!proposal.parameters)
                            return "No parameters to decode";
                          // Remove "0x" prefix if present
                          const hexValue = proposal.parameters.startsWith("0x")
                            ? proposal.parameters.slice(2)
                            : proposal.parameters;
                          // Deserialize Clarity value
                          const clarityValue = deserializeCV(
                            Buffer.from(hexValue, "hex")
                          );
                          // Convert to readable string format
                          return cvToString(clarityValue);
                        } catch (error) {
                          return `Error decoding: ${
                            error instanceof Error
                              ? error.message
                              : String(error)
                          }`;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Details Section */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="technical-details" className="border-none">
            <AccordionTrigger className="py-2 text-sm font-medium">
              See More
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <Hash className="h-4 w-4 flex-shrink-0" />
                    <span className="font-mono break-all">
                      tx_id:{" "}
                      <a
                        href={`http://explorer.hiro.so/txid/${proposal.tx_id}${
                          process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
                            ? "?chain=testnet"
                            : ""
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline "
                      >
                        {truncateString(proposal.tx_id, 8, 8)}
                      </a>
                    </span>
                    <CopyButton text={proposal.tx_id} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <Wallet className="h-4 w-4 flex-shrink-0" />
                    <span className="font-mono break-all">
                      Principal:{" "}
                      {truncateString(proposal.contract_principal, 8, 8)}
                    </span>
                    <CopyButton text={proposal.contract_principal} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <Layers className="h-4 w-4 flex-shrink-0" />
                    <span>Snapshot block:</span>
                    <BlockVisual
                      value={proposal.created_at_block}
                      type="stacks"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <ArrowRight className="h-4 w-4 flex-shrink-0" />
                    <span>Start block:</span>
                    <BlockVisual value={proposal.start_block} type="bitcoin" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <Timer className="h-4 w-4 flex-shrink-0" />
                    <span>End block:</span>
                    <BlockVisual value={proposal.end_block} type="bitcoin" />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
    pending: proposals.filter((p) => p.status === "PENDING").length,
    draft: proposals.filter((p) => p.status === "DRAFT").length,
    failed: proposals.filter((p) => p.status === "FAILED").length,
    total: proposals.length,
    successRate: (() => {
      const totalCompletedProposals = proposals.filter(
        (p) => p.status === "DEPLOYED" || p.status === "FAILED"
      ).length;

      // If no completed proposals, return 0
      if (totalCompletedProposals === 0) return 0;

      // Calculate success rate
      return Math.round(
        (proposals.filter((p) => p.status === "DEPLOYED").length /
          totalCompletedProposals) *
          100
      );
    })(),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <CardHeader className="p-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Active Proposals
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center">
              <div className="text-2xl font-bold">{stats.active}</div>
              <Badge
                variant="secondary"
                className="ml-2 bg-green-500/10 text-green-500"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Deployed
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Pending Proposals
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <Badge
                variant="secondary"
                className="ml-2 bg-blue-500/10 text-blue-500"
              >
                <Timer className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Success Rate
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Of completed proposals
            </p>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Proposals
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="flex gap-1 mt-1">
              <Badge variant="outline" className="text-xs">
                {stats.draft} drafts
              </Badge>
              <Badge variant="outline" className="text-xs">
                {stats.failed} failed
              </Badge>
            </div>
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

      {filteredProposals.length === 0 ? (
        <Card className="p-8 text-center">
          <CardDescription>
            No proposals found with the selected filter.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}

export { DAOProposals };
export default DAOProposals;
