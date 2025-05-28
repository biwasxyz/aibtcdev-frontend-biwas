"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DAO, Token } from "@/types/supabase";
import { useChatStore } from "@/store/chat";
import { useSessionStore } from "@/store/session";
import { useQuery } from "@tanstack/react-query";
import { fetchDAOExtensions } from "@/queries/dao-queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface DAOSendProposalProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  size?: "sm" | "default";
  className?: string;
}

interface ApiResponse {
  output: string;
  error: string | null;
  success: boolean;
}

interface ParsedOutput {
  success: boolean;
  message: string;
  data: {
    txid?: string;
    link?: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                           Utility Functions                               */
/* -------------------------------------------------------------------------- */

/**
 * The `output` field that comes back from the backend is *not* pure JSON – it
 * contains a bunch of human‑readable logging lines followed by the JSON block
 * we actually want.  This helper finds the **last** opening curly brace and
 * tries to `JSON.parse` everything from there onward.
 */
function parseOutput(raw: string): ParsedOutput | null {
  const idxArr: number[] = [];
  for (let i = 0; i < raw.length; i++) if (raw[i] === "{") idxArr.push(i);
  for (const idx of idxArr) {
    const slice = raw.slice(idx).trim();
    try {
      return JSON.parse(slice);
    } catch {
      continue; // keep trying – probably hit a nested "{" first
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*                               Main component                               */
/* -------------------------------------------------------------------------- */

export function DAOSendProposal({
  daoId,
  size = "default",
  className,
}: DAOSendProposalProps) {
  /* ---------------------------- Local component state --------------------------- */
  const [inputValue, setInputValue] = useState("");
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  /* ------------------------ Global stores / session data ----------------------- */
  const { activeThreadId, connect, isConnected } = useChatStore();
  const { accessToken, isLoading: isSessionLoading } = useSessionStore();

  /* ----------------------------- DAO extensions -------------------------------- */
  const { data: daoExtensions, isLoading: isLoadingExtensions } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 10 * 60 * 1000, // 10 min
  });

  /* -------------------------- WebSocket auto‑connect --------------------------- */
  useEffect(() => {
    if (accessToken && !isConnected && !isSessionLoading) {
      connect(accessToken);
    }
  }, [accessToken, isConnected, connect, isSessionLoading]);

  /* ---------------------- Helpers – extension data builder --------------------- */
  const buildExtensionData = () => {
    if (!daoExtensions || daoExtensions.length === 0) return null;

    const findExt = (type: string, subtype: string) =>
      daoExtensions.find((ext) => ext.type === type && ext.subtype === subtype);

    const actionProposalsVotingExt = findExt(
      "EXTENSIONS",
      "ACTION_PROPOSAL_VOTING"
    );
    const actionProposalContractExt = findExt("ACTIONS", "SEND_MESSAGE");
    const daoTokenExt = findExt("TOKEN", "DAO");

    if (!actionProposalsVotingExt || !actionProposalContractExt || !daoTokenExt)
      return null;

    return {
      action_proposals_voting_extension:
        actionProposalsVotingExt.contract_principal,
      action_proposal_contract_to_execute:
        actionProposalContractExt.contract_principal,
      dao_token_contract_address: daoTokenExt.contract_principal,
      message: inputValue.trim(),
    };
  };

  /* ------------------------------ API call helper ------------------------------ */
  const sendRequest = async (payload: Record<string, string>) => {
    if (!accessToken) throw new Error("Missing access token");

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `https://core-staging.aibtc.dev/tools/dao/action_proposals/propose_send_message?token=${encodeURIComponent(
          accessToken
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = (await res.json()) as ApiResponse;
      console.log("API Response:", json);

      // Don't throw here - let processApiResponse handle the logic
      return json;
    } finally {
      setIsSubmitting(false);
    }
  };

  /* --------------------------------- Handlers --------------------------------- */
  const handleSendMessage = async () => {
    if (inputValue.trim().length < 50) {
      setInputError("Message should have at least 50 characters");
      return;
    }

    if (!activeThreadId) return;
    setInputError(null);

    const extensionData = buildExtensionData();
    if (!extensionData) {
      setInputError("Could not determine required DAO extensions");
      return;
    }

    try {
      const response = await sendRequest(extensionData);

      setApiResponse(response);
      setShowResultDialog(true);

      // Clear input after any response (success or error)
      setInputValue("");
    } catch (err) {
      // Handle network errors or other unexpected errors
      const networkErrorResponse: ApiResponse = {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to connect to the server",
        output: "",
      };

      setApiResponse(networkErrorResponse);
      setShowResultDialog(true);
    }
  };

  const handleRetry = () => {
    setShowResultDialog(false);
    // Modal closed, user can try again
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  const hasAccessToken = !!accessToken && !isSessionLoading;

  return (
    <>
      {/* ------------------------------- Input box ------------------------------ */}
      <div className={`w-full ${className ?? ""}`}>
        <div className="relative w-full">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (inputError) setInputError(null);
            }}
            placeholder={
              hasAccessToken
                ? "Send on-chain message"
                : "Connect your wallet to send a message"
            }
            className={`w-full h-20 pr-16 text-base ${
              inputError ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
            onKeyDown={handleKeyDown}
            disabled={!hasAccessToken || isSubmitting || isLoadingExtensions}
          />
          <div className="absolute bottom-2 right-2">
            <Button
              variant="primary"
              size={size}
              onClick={handleSendMessage}
              disabled={
                !hasAccessToken ||
                !inputValue.trim() ||
                inputValue.trim().length < 50 ||
                !isConnected ||
                isSubmitting ||
                isLoadingExtensions
              }
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {inputError && (
          <p className="text-sm text-red-500 mt-1">{inputError}</p>
        )}
        {!inputError &&
          hasAccessToken &&
          inputValue.trim().length > 0 &&
          inputValue.trim().length < 50 && (
            <p className="text-sm text-red-500 mt-1">
              {`Message needs ${50 - inputValue.trim().length} more characters`}
            </p>
          )}
        {isLoadingExtensions && (
          <p className="text-sm text-gray-500 mt-1">Loading DAO extensions…</p>
        )}
      </div>

      {/* ----------------------------- Result modal ----------------------------- */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-2xl">
          {apiResponse?.success ? (
            // Success state
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Transaction Successful
                </DialogTitle>
                <DialogDescription className="text-base">
                  Your DAO proposal has been successfully submitted to the
                  blockchain.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                {(() => {
                  const parsed = parseOutput(apiResponse.output);
                  return (
                    parsed?.data?.link && (
                      <div className="flex justify-center">
                        <Button asChild>
                          <a
                            href={parsed.data.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                            View on Explorer
                          </a>
                        </Button>
                      </div>
                    )
                  );
                })()}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  variant="default"
                  onClick={() => setShowResultDialog(false)}
                >
                  Close
                </Button>
              </div>
            </>
          ) : (
            // Error state
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Transaction Failed
                </DialogTitle>
                <DialogDescription className="text-base">
                  There was an error processing your DAO proposal.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                <div className="bg-muted border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Error Details</h4>
                  <div className="text-sm">
                    {apiResponse?.error || "An unknown error occurred"}
                  </div>
                  {apiResponse?.output && (
                    <details className="mt-3">
                      <summary className="cursor-pointer hover:underline">
                        View full response
                      </summary>
                      <pre className="whitespace-pre-wrap text-xs bg-white p-3 rounded border mt-2 max-h-48 overflow-auto font-mono">
                        {apiResponse.output}
                      </pre>
                    </details>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={handleRetry}>
                  Try Again
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowResultDialog(false)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
