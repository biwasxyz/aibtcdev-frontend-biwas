// File: src/components/BlockVisual.tsx
"use client";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BlockVisualProps {
  value: number | null;
  type?: "stacks" | "bitcoin";
}

const BlockVisual: React.FC<BlockVisualProps> = ({
  value,
  type = "stacks",
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

export default BlockVisual;
