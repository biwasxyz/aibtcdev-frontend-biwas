"use client";

import { ExternalLink } from "lucide-react";

interface ToolOutputParserProps {
  toolOutput: string;
  className?: string;
  showFullOutput?: boolean;
}

export function ToolOutputParser({
  toolOutput,
  className,
  showFullOutput = true,
}: ToolOutputParserProps) {
  try {
    // Parse the outer JSON
    const parsedOutput = JSON.parse(toolOutput);

    // Check if we have an output string to parse
    if (!parsedOutput.output || typeof parsedOutput.output !== "string") {
      return showFullOutput ? (
        <pre className={className}>{toolOutput}</pre>
      ) : null;
    }

    try {
      // Parse the inner JSON from the output field
      const innerJson = JSON.parse(parsedOutput.output);

      // Check if we have transaction data with a link
      if (innerJson.data?.link && typeof innerJson.data.link === "string") {
        const txLink = innerJson.data.link;

        return (
          <div className={className}>
            {/* Only show the full JSON output if showFullOutput is true */}
            {showFullOutput && (
              <pre className="whitespace-pre-wrap break-words font-mono mb-2">
                {toolOutput}
              </pre>
            )}

            {/* Always show the explorer link button */}
            <div className={showFullOutput ? "mt-2" : ""}>
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
      // If inner JSON parsing fails, fall back to displaying the output string if showFullOutput is true
      return showFullOutput ? (
        <pre className={className}>{toolOutput}</pre>
      ) : null;
    }
  } catch (error) {
    // If JSON parsing fails completely, just show the original string if showFullOutput is true
    return showFullOutput ? (
      <pre className={className}>{toolOutput}</pre>
    ) : null;
  }

  // Default fallback
  return showFullOutput ? <pre className={className}>{toolOutput}</pre> : null;
}
