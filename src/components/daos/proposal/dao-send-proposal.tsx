"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DAO, Token } from "@/types/supabase";
import { useChatStore } from "@/store/chat";
import { useQuery } from "@tanstack/react-query";
import { fetchDAOExtensions } from "@/queries/dao-queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DAOSendProposalProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  size?: "sm" | "default";
  className?: string;
}

export function DAOSendProposal({
  daoId,
  size = "default",
  className,
}: DAOSendProposalProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const { activeThreadId, sendMessage } = useChatStore();

  // Fetch DAO extensions
  const { data: daoExtensions } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 600000, // 10 minutes
  });

  const handleSendMessage = () => {
    // Validate message length - changed from 100 to 50
    if (inputValue.trim().length < 50) {
      setInputError("Message should have at least 50 characters");
      return;
    }

    if (!inputValue.trim() || !activeThreadId) return;

    // Clear any previous errors
    setInputError(null);

    // Find the relevant extensions
    const relevantExtensions =
      daoExtensions?.filter((ext) =>
        [
          "EXTENSIONS_ACTION_PROPOSALS",
          "ACTIONS_MESSAGING_SEND_MESSAGE",
          "TOKEN_DAO",
        ].includes(ext.type)
      ) || [];

    // Format the extensions list
    const extensionsList = relevantExtensions
      .map((ext) => `${ext.type}: ${ext.contract_principal}`)
      .join("\n");

    // Append the extension types to the message without showing to user
    const messageWithExtensions = `${inputValue}

    ${extensionsList}
`;

    // Send the message with hidden extension types
    sendMessage(activeThreadId, messageWithExtensions);

    // Reset input
    setInputValue("");

    // Show success dialog
    setShowSuccessDialog(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <div className={`flex w-full gap-2 flex-col ${className}`}>
        <div className="flex w-full gap-2">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // Clear error when user starts typing again
              if (inputError) setInputError(null);
            }}
            placeholder="Send on-chain message"
            className={`flex-grow ${
              inputError ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
            onKeyDown={handleKeyDown}
          />
          <Button
            variant="primary"
            size={size}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || inputValue.trim().length < 50}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {inputError && (
          <p className="text-sm text-red-500 mt-1">{inputError}</p>
        )}
        {!inputError &&
          inputValue.trim().length > 0 &&
          inputValue.trim().length < 50 && (
            <p className="text-sm text-red-500 mt-1">
              {`Message needs ${
                50 - inputValue.trim().length
              } more characters (minimum 50)`}
            </p>
          )}
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>
              Your proposal message will be on-chain in a few seconds...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button
              variant="default"
              onClick={() => setShowSuccessDialog(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
