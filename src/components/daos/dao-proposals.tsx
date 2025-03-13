"use client";

import type React from "react";
import { useState } from "react";
import { deserializeCV, cvToString } from "@stacks/transactions";
import { format } from "date-fns";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Info,
} from "lucide-react";

export interface Proposal {
  id: string;
  created_at: string;
  title: string;
  description: string;
  status: "DRAFT" | "PENDING" | "DEPLOYED" | "FAILED";
  contract_principal: string;
  tx_id: string;
  dao_id: string;
  proposal_id: string;
  action: string;
  caller: string;
  creator: string;
  created_at_block: number;
  end_block: number;
  start_block: number;
  liquid_tokens: number | null;
  parameters: string;
  concluded_by: string;
  executed: boolean;
  met_quorum: boolean;
  met_threshold: boolean;
  passed: boolean;
  votes_against: string;
  votes_for: string;
}

interface DAOProposalsProps {
  proposals: Proposal[];
}

/** StatusBadge highlights the proposal state with a badge */
const StatusBadge = ({ status }: { status: Proposal["status"] }) => {
  const config = {
    DRAFT: {
      color: "bg-secondary/10 text-secondary",
      icon: FileEdit,
      label: "Draft",
      tooltip: "This proposal is in draft state and not yet active.",
    },
    PENDING: {
      color: "bg-primary/10 text-primary",
      icon: Timer,
      label: "Pending",
      tooltip: "This proposal is awaiting votes.",
    },
    DEPLOYED: {
      color: "bg-primary/10 text-primary",
      icon: CheckCircle2,
      label: "Deployed",
      tooltip: "This proposal has been approved and executed.",
    },
    FAILED: {
      color: "bg-secondary/10 text-secondary",
      icon: XCircle,
      label: "Failed",
      tooltip: "This proposal did not receive enough support.",
    },
  };

  const { color, icon: Icon, label, tooltip } = config[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={`${color} text-sm`}>
            <span className="flex items-center gap-1.5">
              <Icon className="h-4 w-4" />
              {label}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/** Utility: Truncate a string with fallback text */
const truncateString = (
  str: string,
  startLength: number,
  endLength: number
) => {
  if (!str) return "No data available";
  if (str.length <= startLength + endLength) return str;
  return `${str.slice(0, startLength)}...${str.slice(-endLength)}`;
};

/** Format the action string */
const formatAction = (action: string) => {
  if (!action) return "No data available";
  const parts = action.split(".");
  return parts.length <= 1
    ? action.toUpperCase()
    : parts[parts.length - 1].toUpperCase();
};

/** Generate explorer links */
const getExplorerLink = (type: string, value: string) => {
  const isTestnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet";
  const testnetParam = isTestnet ? "?chain=testnet" : "";
  switch (type) {
    case "tx":
      return `http://explorer.hiro.so/txid/${value}${testnetParam}`;
    case "address":
      return `http://explorer.hiro.so/address/${value}${testnetParam}`;
    case "contract":
      return `http://explorer.hiro.so/txid/${value}${testnetParam}`;
    default:
      return "";
  }
};

/** BlockVisual displays block information */
const BlockVisual = ({
  value,
  type = "stacks",
}: {
  value: number | null;
  type?: "stacks" | "bitcoin";
}) => {
  if (value === null) return <span className="text-sm">No data available</span>;
  const color = type === "stacks" ? "bg-primary" : "bg-secondary";
  const icon =
    type === "stacks" ? (
      <div className={`w-2 h-2 rounded-sm ${color} mr-1.5`} />
    ) : (
      <div className={`w-2 h-2 rounded-full ${color} mr-1.5`} />
    );
  const label = type === "stacks" ? "STX" : "BTC";
  const tooltip =
    type === "stacks"
      ? "Block height on the Stacks blockchain"
      : "Block height on the Bitcoin blockchain";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {icon}
            <span className="text-sm">{value.toLocaleString()}</span>
            <span className="ml-1">{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/** LabeledField displays a label with its value and an optional copy button */
const LabeledField = ({
  icon: Icon,
  label,
  value,
  copy,
  link,
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  copy?: string;
  link?: string;
}) => {
  const displayValue =
    (typeof value === "string" && value.trim() === "") || !value
      ? "No data available"
      : value;
  return (
    <div className="flex flex-wrap items-center gap-2 my-3">
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium text-sm">{label}:</span>
      <span className="break-all text-sm">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {displayValue}
          </a>
        ) : (
          displayValue
        )}
      </span>
      {copy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-secondary/10 transition-colors"
          onClick={() => navigator.clipboard.writeText(copy)}
          title="Copy to clipboard"
        >
          <Copy className="h-3 w-3" />
          <span className="sr-only">Copy to clipboard</span>
        </Button>
      )}
    </div>
  );
};

/** CopyButton (if needed) */
export const CopyButton = ({ text }: { text: string }) => {
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
      className="h-6 w-6 hover:bg-secondary/10 transition-colors"
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckIcon className="h-3 w-3" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      <span className="sr-only">Copy to clipboard</span>
    </Button>
  );
};

/** MessageDisplay shows the decoded message with a "Message:" prefix and centered.
 * On mobile, the message is wrapped in an accordion.
 */
const MessageDisplay = ({ message }: { message: string }) => {
  let decodedMessage = "";
  try {
    if (!message)
      return (
        <p className="text-center text-lg">Message: No message available</p>
      );
    const hexValue = message.startsWith("0x") ? message.slice(2) : message;
    const clarityValue = deserializeCV(Buffer.from(hexValue, "hex"));
    decodedMessage = cvToString(clarityValue);
  } catch (error) {
    decodedMessage = `Unable to decode message: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
  return (
    <>
      <div className="hidden md:block p-4 text-center text-lg font-medium">
        Message: {decodedMessage}
      </div>
      <div className="block md:hidden">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="message">
            <AccordionTrigger className="py-2 text-lg font-bold text-center">
              View Message
            </AccordionTrigger>
            <AccordionContent className="p-4 text-center">
              Message: {decodedMessage}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
};

/** VoteProgress displays a single bar with Yes (green) and No (red) segments.
 * If vote data is missing, it shows "No voting data available."
 */
const VoteProgress = ({
  votesFor,
  votesAgainst,
}: {
  votesFor: string;
  votesAgainst: string;
}) => {
  if (
    (!votesFor || votesFor.trim() === "") &&
    (!votesAgainst || votesAgainst.trim() === "")
  ) {
    return (
      <div className="p-4 my-4 text-center">No voting data available.</div>
    );
  }
  const yesVotes = (Number.parseFloat(votesFor) || 0) / 1e8;
  const noVotes = (Number.parseFloat(votesAgainst) || 0) / 1e8;
  const totalVotes = yesVotes + noVotes;
  let yesPercent = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 50;
  let noPercent = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 50;
  const minDisplay = 5;
  if (yesVotes > 0 && yesPercent < minDisplay) yesPercent = minDisplay;
  if (noVotes > 0 && noPercent < minDisplay) noPercent = minDisplay;
  const sum = yesPercent + noPercent;
  if (sum > 100) {
    const factor = 100 / sum;
    yesPercent *= factor;
    noPercent *= factor;
  }
  return (
    <div className="rounded-lg border border-secondary p-4 my-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4" />
        <h4 className="font-medium text-sm">Voting Progress</h4>
      </div>
      <div className="relative h-8 w-full rounded-full bg-secondary/10 overflow-hidden">
        <div
          className="absolute left-0 h-full bg-green-500 flex items-center justify-center text-white text-xs font-bold"
          style={{ width: `${yesPercent}%` }}
        >
          {yesVotes.toFixed(2)} Yes
        </div>
        <div
          className="absolute right-0 h-full bg-red-500 flex items-center justify-center text-white text-xs font-bold"
          style={{ width: `${noPercent}%` }}
        >
          {noVotes.toFixed(2)} No
        </div>
      </div>
      <div className="text-sm text-center pt-1">
        Total: {totalVotes.toFixed(2)} votes
      </div>
    </div>
  );
};

/** ProposalMetrics shows key voting details using badges.
 * Liquid tokens are displayed (divided by 1e8).
 */
const ProposalMetrics = ({ proposal }: { proposal: Proposal }) => {
  const yesVotes = (Number.parseFloat(proposal.votes_for) || 0) / 1e8;
  const noVotes = (Number.parseFloat(proposal.votes_against) || 0) / 1e8;
  const totalVotes = yesVotes + noVotes;
  const liquidTokens =
    proposal.liquid_tokens !== null
      ? (proposal.liquid_tokens / 1e8).toFixed(2)
      : "No data available";
  return (
    <div className="p-4 bg-secondary/10 rounded-lg my-4">
      <h4 className="text-sm font-bold mb-2">Voting Metrics</h4>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-sm">
          Yes: {yesVotes.toFixed(2)}
        </Badge>
        <Badge variant="secondary" className="text-sm">
          No: {noVotes.toFixed(2)}
        </Badge>
        <Badge variant="secondary" className="text-sm">
          Total: {totalVotes.toFixed(2)}
        </Badge>
        <Badge variant="secondary" className="text-sm">
          Liquid Tokens: {liquidTokens}
        </Badge>
        <Badge
          variant={proposal.met_quorum ? "default" : "destructive"}
          className="text-sm"
        >
          Quorum: {proposal.met_quorum ? "Met" : "Not Met"}
        </Badge>
        <Badge
          variant={proposal.met_threshold ? "default" : "destructive"}
          className="text-sm"
        >
          Threshold: {proposal.met_threshold ? "Met" : "Not Met"}
        </Badge>
        <Badge
          variant={proposal.passed ? "default" : "destructive"}
          className="text-sm"
        >
          Outcome: {proposal.passed ? "Passed" : "Failed"}
        </Badge>
      </div>
    </div>
  );
};

/** TimeStatus shows a countdown for active proposals or indicates that voting has ended.
 * If concludedBy is present, it is displayed.
 */
const TimeStatus = ({
  createdAt,
  status,
  concludedBy,
}: {
  createdAt: string;
  status: Proposal["status"];
  concludedBy?: string;
}) => {
  const start = new Date(createdAt);
  const estimatedEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();
  const remainingMs = estimatedEnd.getTime() - now.getTime();
  const formatRemaining = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };
  if (status === "DEPLOYED" || status === "FAILED") {
    return (
      <div className="flex flex-col gap-1 mt-2">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          <span className="text-sm">Voting ended</span>
        </div>
        {concludedBy && (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              Concluded by: {truncateString(concludedBy, 6, 4)}
            </span>
          </div>
        )}
      </div>
    );
  }
  if (remainingMs > 0) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Timer className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">
          Voting in progress – {formatRemaining(remainingMs)} remaining
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 mt-2">
      <Timer className="h-4 w-4" />
      <span className="text-sm">Voting ended</span>
    </div>
  );
};

/** ProposalCard displays the proposal details and metrics.
 * Non-critical blockchain details are wrapped in an accordion on mobile.
 */
const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
  const getEstimatedEndDate = (createdAt: string): Date => {
    const start = new Date(createdAt);
    return new Date(start.getTime() + 24 * 60 * 60 * 1000);
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md overflow-hidden">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{proposal.title}</h3>
              <StatusBadge status={proposal.status} />
            </div>
            <p className="text-sm">
              {proposal.description || "No description available"}
            </p>
            <TimeStatus
              createdAt={proposal.created_at}
              concludedBy={proposal.concluded_by}
              status={proposal.status}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-1">
        {proposal.parameters && (
          <MessageDisplay message={proposal.parameters} />
        )}
        <VoteProgress
          votesFor={proposal.votes_for}
          votesAgainst={proposal.votes_against}
        />
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="space-y-1 mb-4 lg:mb-0">
            <h4 className="font-medium text-sm mb-2">Timing & Blocks</h4>
            <LabeledField
              icon={Calendar}
              label="Created"
              value={format(
                new Date(proposal.created_at),
                "MMM d, yyyy 'at' h:mm a"
              )}
            />
            <LabeledField
              icon={Timer}
              label="Ends"
              value={format(
                getEstimatedEndDate(proposal.created_at),
                "MMM d, yyyy 'at' h:mm a"
              )}
            />
            <LabeledField
              icon={Layers}
              label="Snapshot block"
              value={
                <BlockVisual value={proposal.created_at_block} type="stacks" />
              }
            />
            <LabeledField
              icon={ArrowRight}
              label="Start block"
              value={
                <BlockVisual value={proposal.start_block} type="bitcoin" />
              }
            />
            <LabeledField
              icon={Timer}
              label="End block"
              value={<BlockVisual value={proposal.end_block} type="bitcoin" />}
            />
            <LabeledField
              icon={Wallet}
              label="Liquid Tokens"
              value={
                proposal.liquid_tokens !== null
                  ? (proposal.liquid_tokens / 1e8).toFixed(2)
                  : "No data available"
              }
            />
          </div>
          <div className="space-y-1">
            <div className="block lg:hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details">
                  <AccordionTrigger className="py-2 text-sm font-medium hover:bg-secondary/10 rounded-md transition-colors">
                    <span className="flex items-center gap-2">
                      Blockchain Details
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="space-y-1">
                      <LabeledField
                        icon={User}
                        label="Creator"
                        value={truncateString(proposal.creator, 8, 8)}
                        link={getExplorerLink("address", proposal.creator)}
                      />
                      <LabeledField
                        icon={Activity}
                        label="Action"
                        value={formatAction(proposal.action)}
                        link={
                          proposal.action
                            ? getExplorerLink("contract", proposal.action)
                            : undefined
                        }
                      />
                      <LabeledField
                        icon={Hash}
                        label="Transaction ID"
                        value={truncateString(proposal.tx_id, 8, 8)}
                        link={getExplorerLink("tx", proposal.tx_id)}
                      />
                      <LabeledField
                        icon={Wallet}
                        label="Principal"
                        value={formatAction(proposal.contract_principal)}
                        link={getExplorerLink(
                          "contract",
                          proposal.contract_principal
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <div className="hidden lg:block space-y-1">
              <h4 className="font-medium text-sm mb-2">Blockchain Details</h4>
              <LabeledField
                icon={User}
                label="Creator"
                value={truncateString(proposal.creator, 8, 8)}
                link={getExplorerLink("address", proposal.creator)}
              />
              <LabeledField
                icon={Activity}
                label="Action"
                value={formatAction(proposal.action)}
                link={
                  proposal.action
                    ? getExplorerLink("contract", proposal.action)
                    : undefined
                }
              />
              <LabeledField
                icon={Hash}
                label="Transaction ID"
                value={truncateString(proposal.tx_id, 8, 8)}
                link={getExplorerLink("tx", proposal.tx_id)}
              />
              <LabeledField
                icon={Wallet}
                label="Principal"
                value={formatAction(proposal.contract_principal)}
                link={getExplorerLink("contract", proposal.contract_principal)}
              />
            </div>
          </div>
        </div>
        <ProposalMetrics proposal={proposal} />
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        {stats.active} deployed out of{" "}
                        {stats.active + stats.failed} completed proposals.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
}

export { DAOProposals };
export default DAOProposals;
