"use client";
import type React from "react";
import CopyButton from "./CopyButton";

interface MessageDisplayProps {
  message: string;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  // Handle empty message
  if (!message) {
    return (
      <div className="rounded-lg bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">On-Chain Message</h4>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          No message available
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-base">On-Chain Message</h4>
        </div>
        <CopyButton text={message} />
      </div>

      <div className="p-3 rounded bg-zinc-800 text-sm break-words">
        {message}
      </div>
    </div>
  );
};

export default MessageDisplay;
