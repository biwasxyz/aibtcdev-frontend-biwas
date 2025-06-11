export const PROPOSAL_STATUSES = [
  "created", // until we confirm the TX is mined
  "voting_delay", // after proposal is created, but before voting starts
  "voting_active", // when voting is open
  "veto_period", // also an execution delay
  "executable", // not concluded but can be executed
  "expired", // not concluded but cannot be executed anymore
  "concluded", // proposal is concluded, final state
] as const;

export type ProposalStatus = typeof PROPOSAL_STATUSES[number];

import { LucideIcon, BarChart3, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export interface StatusConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  label: string;
}

export function getStatusConfig(
  isActive: boolean,
  isEnded: boolean,
  passed: boolean,
): StatusConfig {
  if (isActive) {
    return {
      icon: BarChart3,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      label: "Active",
    };
  }
  if (isEnded && passed) {
    return {
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      label: "Passed",
    };
  }
  if (isEnded && !passed) {
    return {
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      label: "Failed",
    };
  }
  return {
    icon: AlertCircle,
    color: "text-muted-foreground",
    bg: "bg-muted/10",
    border: "border-muted/20",
    label: "Pending",
  };
}
