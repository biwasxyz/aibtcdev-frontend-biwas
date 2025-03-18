"use client";
import type React from "react";
import { useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import CopyButton from "./CopyButton";
import { deserializeCV, cvToString } from "@stacks/transactions";

interface MessageDisplayProps {
  message: string;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  const [expanded, setExpanded] = useState(false);

  // Handle empty message
  if (!message) {
    return (
      <div className="rounded-lg bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium text-sm">Message</h4>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          No message available
        </div>
      </div>
    );
  }

  // Try to decode the Clarity Value
  let decodedMessage = "";
  try {
    const hexValue = message.startsWith("0x") ? message.slice(2) : message;
    const clarityValue = deserializeCV(Buffer.from(hexValue, "hex"));
    decodedMessage = cvToString(clarityValue);
  } catch (error) {
    decodedMessage = `Unable to decode message: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }

  // Determine if we should truncate
  const shouldTruncate = decodedMessage.length > 150;
  const displayMessage =
    !expanded && shouldTruncate
      ? decodedMessage.substring(0, 150) + "..."
      : decodedMessage;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <h4 className="font-medium text-base">Message</h4>
        </div>
        <CopyButton text={decodedMessage} />
      </div>

      <div
        className={`p-3 rounded bg-zinc-800 text-sm break-words ${
          !expanded && shouldTruncate ? "max-h-32 overflow-y-auto" : ""
        }`}
      >
        {displayMessage}
      </div>

      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="ml-1 h-3 w-3" />
            </>
          ) : (
            <>
              Show more <ChevronDown className="ml-1 h-3 w-3" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default MessageDisplay;
