// File: src/components/StatusBadge.tsx
"use client";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Timer, CheckCircle2, XCircle } from "lucide-react";
import { Proposal } from "@/types/supabase";

interface StatusBadgeProps {
  status: Proposal["status"];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
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

export default StatusBadge;
