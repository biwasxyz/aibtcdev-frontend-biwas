"use client";

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
        // Just display the full JSON output
        return <pre className={className}>{toolOutput}</pre>;
      }
    } catch {
      // If inner JSON parsing fails, fall back to displaying the output string if showFullOutput is true
      return showFullOutput ? (
        <pre className={className}>{toolOutput}</pre>
      ) : null;
    }
  } catch {
    // If JSON parsing fails completely, just show the original string if showFullOutput is true
    return showFullOutput ? (
      <pre className={className}>{toolOutput}</pre>
    ) : null;
  }

  // Default fallback
  return showFullOutput ? <pre className={className}>{toolOutput}</pre> : null;
}
