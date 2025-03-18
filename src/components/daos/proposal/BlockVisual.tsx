"use client";
import type React from "react";
import { ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface BlockVisualProps {
  value: number;
  type: "bitcoin" | "stacks";
}

const BlockVisual: React.FC<BlockVisualProps> = ({ value, type }) => {
  const getExplorerUrl = () => {
    if (type === "bitcoin") {
      return `https://mempool.space/block/${value}`;
    } else {
      return `https://explorer.stacks.co/block/${value}`;
    }
  };

  const getTypeColor = () => {
    return type === "bitcoin"
      ? "bg-orange-500/20 text-orange-500 border-orange-500/30"
      : "bg-blue-500/20 text-blue-500 border-blue-500/30";
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge
        variant="outline"
        className={`${getTypeColor()} font-medium text-xs`}
      >
        {type === "bitcoin" ? "BTC" : "STX"}
      </Badge>
      <code className="bg-zinc-800 px-2 py-0.5 rounded text-xs">{value}</code>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="sr-only">View on explorer</span>
            </a>
          </TooltipTrigger>
          <TooltipContent>
            <p>View on {type === "bitcoin" ? "Bitcoin" : "Stacks"} explorer</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default BlockVisual;
