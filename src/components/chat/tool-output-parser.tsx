"use client";

import { ExternalLink } from "lucide-react";

interface ToolOutputParserProps {
  toolOutput: string;
  className?: string;
}

export function ToolOutputParser({
  toolOutput,
  className,
}: ToolOutputParserProps) {
  try {
    // Parse the outer JSON
    const parsedOutput = JSON.parse(toolOutput);

    // Check if we have an output string to parse
    if (!parsedOutput.output || typeof parsedOutput.output !== "string") {
      return <pre className={className}>{toolOutput}</pre>;
    }

    try {
      // Parse the inner JSON from the output field
      const innerJson = JSON.parse(parsedOutput.output);

      // Check if we have transaction data with a link
      if (innerJson.data?.link && typeof innerJson.data.link === "string") {
        const txLink = innerJson.data.link;
        const txId = innerJson.data.txid || "";

        return (
          <div className={`space-y-2 ${className}`}>
            <div className="flex flex-col space-y-1">
              <span className="text-green-400 font-medium">
                ✓ Transaction Successful
              </span>
              <span className="text-zinc-300">{innerJson.message}</span>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-zinc-400 text-sm">Transaction ID:</span>
              <code className="bg-black/30 px-2 py-1 rounded text-amber-300 font-mono text-xs break-all">
                {txId}
              </code>
            </div>

            <div className="mt-2">
              <a
                href={txLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-indigo-900/50 hover:bg-indigo-800/70 text-indigo-300 hover:text-indigo-200 px-3 py-1.5 rounded-md text-sm transition-colors"
              >
                View on Explorer
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        );
      }
    } catch (innerError) {
      // If inner JSON parsing fails, fall back to displaying the output string
      return <pre className={className}>{parsedOutput.output}</pre>;
    }
  } catch (error) {
    // If JSON parsing fails completely, just show the original string
    return <pre className={className}>{toolOutput}</pre>;
  }

  // Default fallback
  return <pre className={className}>{toolOutput}</pre>;
}
