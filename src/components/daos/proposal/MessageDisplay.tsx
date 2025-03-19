"use client";
import type React from "react";
import CopyButton from "./CopyButton";
import { deserializeCV, cvToString } from "@stacks/transactions";

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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-base">On-Chain Message</h4>
        </div>
        <CopyButton text={decodedMessage} />
      </div>

      <div className="p-3 rounded bg-zinc-800 text-sm break-words">
        {decodedMessage}
      </div>
    </div>
  );
};

export default MessageDisplay;
