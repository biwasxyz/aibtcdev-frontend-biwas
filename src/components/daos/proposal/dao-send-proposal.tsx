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

interface DAOChatButtonProps {
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
  ...props
}: DAOChatButtonProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { activeThreadId, sendMessage } = useChatStore();

  // Fetch DAO extensions
  const { data: daoExtensions } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 600000, // 10 minutes
  });

  const handleSendMessage = () => {
    if (!inputValue.trim() || !activeThreadId) return;

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
      <div className={`flex w-full gap-2 ${className}`}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Send on-chain message"
          className="flex-grow"
          onKeyDown={handleKeyDown}
        />
        <Button
          variant="primary"
          size={size}
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
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
