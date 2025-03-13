"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

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

export default LabeledField;
