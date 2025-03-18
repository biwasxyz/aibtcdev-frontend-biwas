"use client";
import type React from "react";
import { ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LabeledFieldProps {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  copy?: string;
  link?: string;
}

const LabeledField: React.FC<LabeledFieldProps> = ({
  icon: Icon,
  label,
  value,
  copy,
  link,
}) => {
  const displayValue =
    (typeof value === "string" && value.trim() === "") || !value
      ? "No data available"
      : value;

  return (
    <div className="flex items-start sm:items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 flex-grow min-w-0">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {label}:
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm break-all overflow-hidden text-ellipsis">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1.5"
              >
                {displayValue}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View on explorer</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </a>
            ) : (
              displayValue
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LabeledField;
