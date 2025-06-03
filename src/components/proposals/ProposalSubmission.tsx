"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Edit3, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/reusables/Loader";
import type { DAO, Token } from "@/types/supabase";
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
import { connectWebSocketClient } from '@stacks/blockchain-api-client';
import { getAllErrorDetails } from "@aibtc/types";

// ---------------------- Unicode validation hook and warning ----------------------
import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface UnicodeIssue {
  char: string;
  code: number;
  position: number;
  type: 'control' | 'non-ascii' | 'suspicious';
  description: string;
}

export function useUnicodeValidation(text: string) {
  const issues = useMemo((): UnicodeIssue[] => {
    const found: UnicodeIssue[] = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = char.charCodeAt(0);
      // Control characters (0-31, except tab, newline, carriage return)
      if (code >= 0 && code <= 31 && ![9, 10, 13].includes(code)) {
        found.push({
          char,
          code,
          position: i,
          type: 'control',
          description: `Invisible control character U+${code.toString(16).padStart(4, '0').toUpperCase()}`
        });
      }
      // Non-ASCII characters (128+)
      else if (code > 127) {
        found.push({
          char,
          code,
          position: i,
          type: 'non-ascii',
          description: `Non-ASCII character U+${code.toString(16).padStart(4, '0').toUpperCase()}`
        });
      }
      // Zero-width and other suspicious characters
      else if ([0x200B, 0x200C, 0x200D, 0x2060, 0xFEFF].includes(code)) {
        found.push({
          char,
          code,
          position: i,
          type: 'suspicious',
          description: `Zero-width or suspicious character U+${code.toString(16).padStart(4, '0').toUpperCase()}`
        });
      }
    }
    return found;
  }, [text]);

  const hasControlChars = issues.some(issue => issue.type === 'control');
  const hasNonAscii = issues.some(issue => issue.type === 'non-ascii');
  const hasSuspicious = issues.some(issue => issue.type === 'suspicious');
  const hasAnyIssues = issues.length > 0;

  const cleanText = text.replace(/[\x00-\x1F\x7F-\uFFFF]/g, '');
  const asciiLength = cleanText.length;

  return {
    issues,
    hasControlChars,
    hasNonAscii,
    hasSuspicious,
    hasAnyIssues,
    cleanText,
    asciiLength,
    originalLength: text.length,
    nonAsciiCount: text.length - asciiLength
  };
}

export function UnicodeIssueWarning({ issues }: { issues: UnicodeIssue[] }) {
  if (issues.length === 0) return null;
  
  const controlCount = issues.filter(i => i.type === 'control').length;
  const nonAsciiCount = issues.filter(i => i.type === 'non-ascii').length;
  const suspiciousCount = issues.filter(i => i.type === 'suspicious').length;
  
  return (
    <div className="mt-1 p-3 bg-primary/10 border border-primary/20 rounded-lg">
      <div className="flex items-start gap-1">
        <AlertTriangle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm flex-1 text-primary-700">
          <p className="font-medium text-primary-700 mb-1">
            Input contains {issues.length} problematic character{issues.length !== 1 ? 's' : ''}:
          </p>
          
          <div className="space-y-4">
            {controlCount > 0 && (
              <div>
                <p className="text-primary-700 font-medium mb-1">
                  • {controlCount} invisible control character{controlCount !== 1 ? 's' : ''} (security risk):
                </p>
                <div className="ml-4 space-y-1">
                  {issues.filter(i => i.type === 'control').map((issue, idx) => (
                    <div key={idx} className="text-sm font-mono bg-primary/20 p-2 rounded border border-primary/30 text-primary-800">
                      <span className="text-primary-800">
                        Position {issue.position}: "{issue.char === '\t' ? '\\t' : issue.char === '\n' ? '\\n' : issue.char === '\r' ? '\\r' : `\\x${issue.code.toString(16).padStart(2, '0')}`}" 
                      </span>
                      <span className="text-primary-600 ml-2">({issue.description})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {nonAsciiCount > 0 && (
              <div>
                <p className="text-primary-700 font-medium mb-1">
                  • {nonAsciiCount} non-ASCII character{nonAsciiCount !== 1 ? 's' : ''} (will be rejected):
                </p>
                <div className="ml-4 space-y-1">
                  {issues.filter(i => i.type === 'non-ascii').map((issue, idx) => (
                    <div key={idx} className="text-sm font-mono bg-primary/20 p-2 rounded border border-primary/30 text-primary-800">
                      <span className="text-primary-800">
                        Position {issue.position}: "{issue.char}" 
                      </span>
                      <span className="text-primary-600 ml-2">({issue.description})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {suspiciousCount > 0 && (
              <div>
                <p className="text-primary-700 font-medium mb-1">
                  • {suspiciousCount} suspicious character{suspiciousCount !== 1 ? 's' : ''} (potential issue):
                </p>
                <div className="ml-4 space-y-1">
                  {issues.filter(i => i.type === 'suspicious').map((issue, idx) => (
                    <div key={idx} className="text-sm font-mono bg-primary/20 p-2 rounded border border-primary/30 text-primary-800">
                      <span className="text-primary-800">
                        Position {issue.position}: "{issue.char}" 
                      </span>
                      <span className="text-primary-600 ml-2">({issue.description})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// --------------------------------------------------------------------------------

interface WebSocketTransactionMessage {
  tx_id: string;
  tx_status: 'success' | 'pending' | 'abort_by_response' | 'abort_by_post_condition' | 'dropped_replace_by_fee' | 'dropped_replace_across_fork' | 'dropped_too_expensive' | 'dropped_stale_garbage_collect' | 'dropped_problematic';
  tx_result?: {
    hex: string;
    repr: string;
  };
  block_height?: number;
  block_time_iso?: string;
  nonce?: number;
  fee_rate?: string;
  sender_address?: string;
  sponsored?: boolean;
  post_condition_mode?: string;
  post_conditions?: unknown[];
  anchor_mode?: string;
  is_unanchored?: boolean;
  block_hash?: string;
  parent_block_hash?: string;
  burn_block_height?: number;
  burn_block_time?: number;
  burn_block_time_iso?: string;
  canonical?: boolean;
  tx_index?: number;
  microblock_hash?: string;
  microblock_sequence?: number;
  microblock_canonical?: boolean;
  event_count?: number;
  events?: unknown[];
  execution_cost_read_count?: number;
  execution_cost_read_length?: number;
  execution_cost_runtime?: number;
  execution_cost_write_count?: number;
  execution_cost_write_length?: number;
  tx_type?: string;
  contract_call?: unknown;
}

interface ProposalSubmissionProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  onSubmissionSuccess?: () => void;
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

export function ProposalSubmission({ daoId, onSubmissionSuccess }: ProposalSubmissionProps) {
  const [proposal, setProposal] = useState("");
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  
  const {
    issues: unicodeIssues,
    hasAnyIssues: hasUnicodeIssues,
    cleanText,
  } = useUnicodeValidation(proposal);

  // WebSocket state
  const [websocketMessage, setWebsocketMessage] = useState<WebSocketTransactionMessage | null>(null);
  const websocketRef = useRef<Awaited<ReturnType<typeof connectWebSocketClient>> | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => Promise<void> } | null>(null);

  // Modal view state: "initial" = submitted, "confirmed-success" = chain confirmed, "confirmed-failure" = chain failed
  const [txStatusView, setTxStatusView] = useState<"initial" | "confirmed-success" | "confirmed-failure">("initial");

  const { accessToken, isLoading: isSessionLoading } = useSessionStore();

  // Error code mapping
  const errorDetailsArray = getAllErrorDetails();
  const errorCodeMap = errorDetailsArray.reduce((map, err) => {
    map[err.code] = err;
    return map;
  }, {} as Record<number, typeof errorDetailsArray[0]>);

  const { data: daoExtensions, isLoading: isLoadingExtensions } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 10 * 60 * 1000, // 10 min
  });

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe?.();
      }
    };
  }, []);

  /* ---------------------- WebSocket helper functions --------------------- */
  const connectToWebSocket = async (txid: string) => {
    try {
      setWebsocketMessage(null);
      setTxStatusView("initial");

      // Determine WebSocket URL based on environment
      const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
      const websocketUrl = isMainnet
        ? 'wss://api.mainnet.hiro.so/'
        : 'wss://api.testnet.hiro.so/';
      
      const client = await connectWebSocketClient(websocketUrl);
      websocketRef.current = client;

      // Subscribe to transaction updates for the specific txid
      const subscription = await client.subscribeTxUpdates(txid, (event) => {
        console.log('WebSocket transaction update:', event);
        setWebsocketMessage(event);

        // Check if transaction has reached a final state
        const { tx_status } = event;
        const isSuccess = tx_status === 'success';
        const isFailed = tx_status === 'abort_by_response' || 
                        tx_status === 'abort_by_post_condition' ||
                        tx_status === 'dropped_replace_by_fee' ||
                        tx_status === 'dropped_replace_across_fork' ||
                        tx_status === 'dropped_too_expensive' ||
                        tx_status === 'dropped_stale_garbage_collect' ||
                        tx_status === 'dropped_problematic';
        const isFinalState = isSuccess || isFailed;

        // Update modal state based on status
        if (isSuccess) setTxStatusView("confirmed-success");
        else if (isFailed) setTxStatusView("confirmed-failure");

        if (isFinalState) {
          // Clean up subscription after receiving final update
          if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe?.()
          }
        } else {
          // Transaction is still pending, keep connection open but update UI
          console.log(`Transaction still pending with status: ${tx_status}`)
        }
      })

      subscriptionRef.current = subscription
    } catch (error) {
      console.error("WebSocket connection error:", error)
    }
  }

  /* ---------------------- Helpers – extension data builder --------------------- */
  const buildExtensionData = () => {
    if (!daoExtensions || daoExtensions.length === 0) return null

    const findExt = (type: string, subtype: string) =>
      daoExtensions.find((ext) => ext.type === type && ext.subtype === subtype)

    const actionProposalsVotingExt = findExt("EXTENSIONS", "ACTION_PROPOSAL_VOTING")
    const actionProposalContractExt = findExt("ACTIONS", "SEND_MESSAGE")
    const daoTokenExt = findExt("TOKEN", "DAO")

    if (!actionProposalsVotingExt || !actionProposalContractExt || !daoTokenExt) return null

    return {
      action_proposals_voting_extension: actionProposalsVotingExt.contract_principal,
      action_proposal_contract_to_execute: actionProposalContractExt.contract_principal,
      dao_token_contract_address: daoTokenExt.contract_principal,
      message: proposal.trim(),
    }
  }

  /* ------------------------------ API call helper ------------------------------ */
  const sendRequest = async (payload: Record<string, string>) => {
    if (!accessToken) throw new Error("Missing access token")

    setIsSubmitting(true)
    try {
      const res = await fetch(
        `https://core-staging.aibtc.dev/tools/dao/action_proposals/propose_send_message?token=${encodeURIComponent(
          accessToken,
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )

      const json = (await res.json()) as ApiResponse
      console.log("API Response:", json)

      return json
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proposal.trim() || proposal.trim().length < 50) return

    const extensionData = buildExtensionData()
    if (!extensionData) {
      console.error("Could not determine required DAO extensions")
      return
    }

    try {
      const response = await sendRequest(extensionData)

      setApiResponse(response)
      setShowResultDialog(true)
      setTxStatusView("initial")

      // If successful, start WebSocket monitoring
      if (response.success) {
        const parsed = parseOutput(response.output)
        const txid = parsed?.data?.txid

        if (txid) {
          await connectToWebSocket(txid)
        }

        // Call success callback and clear form
        onSubmissionSuccess?.()
        setProposal("")
      }
    } catch (err) {
      // Handle network errors or other unexpected errors
      const networkErrorResponse: ApiResponse = {
        success: false,
        error: err instanceof Error ? err.message : "Failed to connect to the server",
        output: "",
      }

      setApiResponse(networkErrorResponse)
      setShowResultDialog(true)
      setTxStatusView("initial")
    }
  }

  const handleAIGenerate = async () => {
    setIsGenerating(true)
    try {
      // TODO: Implement AI text generation
      console.log("Generating AI proposal for DAO:", daoId)

      // Simulate AI generation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const aiText =
        "This is a placeholder for AI-generated proposal text. The AI would analyze the DAO context and generate relevant proposal content based on best practices and the DAO's specific needs. This generated content meets the minimum character requirement for submission."
      setProposal(aiText)
    } catch (error) {
      console.error("Failed to generate AI text:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRetry = () => {
    setShowResultDialog(false)
    // Reset WebSocket state and modal status view
    setWebsocketMessage(null)
    setTxStatusView("initial")
    // Clean up any existing connections
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe?.()
    }
  }

  const hasAccessToken = !!accessToken && !isSessionLoading

  return (
    <>
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Edit3 className="h-6 w-6 text-primary" />;
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Create Proposal</h2>;
            <p className="text-muted-foreground">Submit a new governance proposal to the DAO</p>;
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            {/* Textarea on top */}
            <textarea
              value={proposal}
              onChange={(e) => {
                setProposal(e.target.value)
              }}
              placeholder={
                hasAccessToken
                  ? "Describe your proposal in detail. What changes do you want to make? What are the benefits? Include any relevant context or rationale..."
                  : "Connect your wallet to create a proposal"
              }
              className="relative w-full min-h-[120px] p-4 bg-background/50 border border-border/50 rounded-xl font-mono text-foreground placeholder-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 caret-foreground"
              disabled={!hasAccessToken || isSubmitting || isGenerating || isLoadingExtensions}
            />
            ;{/* Character count */}
            {proposal.length > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                {proposal.length} characters
              </div>
            )}
            {/* Warning and clean button */}
            <UnicodeIssueWarning issues={unicodeIssues} />;
            {hasUnicodeIssues && (
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setProposal(cleanText)} className="text-sm">
                  Remove problematic characters
                </Button>
                ;
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleAIGenerate}
              disabled={!hasAccessToken || isSubmitting || isGenerating || isLoadingExtensions}
              className="flex items-center gap-2 border-secondary/50 text-secondary hover:bg-secondary/10 hover:border-secondary"
            >
              <Sparkles className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />;
              {isGenerating ? "Generating..." : "AI Assist"}
            </Button>
            ;
            <Button
              type="submit"
              disabled={
                !hasAccessToken ||
                !proposal.trim() ||
                proposal.trim().length < 50 ||
                hasUnicodeIssues ||
                isSubmitting ||
                isGenerating ||
                isLoadingExtensions
              }
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
            >
              {isSubmitting ? <Loader /> : <Send className="h-4 w-4" />}
              {isSubmitting ? "Submitting..." : "Submit Proposal"}
            </Button>
            ;
          </div>

          {/* Error/Status Messages */}
          {!hasAccessToken && (
            <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">
              💡 <strong>Note:</strong> Connect your wallet to submit proposals to the DAO.
            </div>
          )}

          {hasAccessToken && proposal.trim().length > 0 && proposal.trim().length < 50 && (
            <div className="text-sm text-red-500 bg-red-50 rounded-lg p-3">
              <strong>Minimum Length Required:</strong> Proposal needs {50 - proposal.trim().length} more characters
              (minimum 50 characters)
            </div>
          )}

          {hasAccessToken && proposal.trim().length >= 50 && (
            <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">
              💡 <strong>Tip:</strong> Make sure your proposal is clear and includes specific actionable items. The
              community will vote on this proposal.
            </div>
          )}

          {isLoadingExtensions && (
            <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">⏳ Loading DAO extensions...</div>
          )}
        </form>
      </div>

      {/* ----------------------------- Result modal ----------------------------- */}
      <Dialog
        open={showResultDialog}
        onOpenChange={(open) => {
          setShowResultDialog(open)
          if (!open) setTxStatusView("initial")
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-auto">
          {apiResponse?.success ? (
            <>
              {(() => {
                const parsed = parseOutput(apiResponse.output)
                // Three states: initial (submitted), confirmed-success, confirmed-failure
                return (
                  <>
                    {txStatusView === "initial" && (
                      <>
                        <DialogHeader>
                          <DialogTitle className="text-xl flex items-center gap-2">
                            <Check className="w-6 h-6" />
                            Proposal Submitted
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            Your DAO proposal has been submitted. Waiting for blockchain confirmation...
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          {parsed?.data?.link && (
                            <div className="flex">
                              <Button asChild>
                                <a
                                  href={parsed.data.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View on Explorer
                                </a>
                              </Button>
                            </div>
                          )}
                          {parsed?.data?.txid && (
                            <div className="border rounded-lg p-4 bg-muted">
                              <h4 className="font-semibold mb-2">Transaction Monitoring</h4>
                              <p className="text-sm mb-2">
                                Transaction ID: <code className="px-1 py-0.5 rounded">{parsed.data.txid}</code>
                              </p>
                              <div className="flex items-center gap-2 text-sm">
                                <Loader />
                                <span>Waiting for transaction confirmation via WebSocket...</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end mt-6">
                          <Button
                            variant="default"
                            onClick={() => {
                              setShowResultDialog(false)
                              setTxStatusView("initial")
                            }}
                          >
                            Close
                          </Button>
                        </div>
                      </>
                    )}
                    {txStatusView === "confirmed-success" && (
                      <>
                        <DialogHeader>
                          <DialogTitle className="text-xl flex items-center gap-2">
                            <Check className="w-6 h-6 text-green-700" />
                            Proposal Confirmed on Blockchain
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            Your proposal was successfully confirmed on-chain.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          {parsed?.data?.link && (
                            <div className="flex">
                              <Button asChild>
                                <a
                                  href={parsed.data.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View on Explorer
                                </a>
                              </Button>
                            </div>
                          )}
                          {websocketMessage && (
                            <div className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-2 text-green-800">✅ Transaction Confirmed</h4>
                              <div className="text-sm mb-2">
                                <span className="font-medium">Status:</span>{" "}
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {websocketMessage.tx_status?.toUpperCase()}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {websocketMessage.tx_id && (
                                  <div>
                                    <span className="font-medium">Transaction ID:</span>
                                    <p className="font-mono text-xs mt-1 break-all">{websocketMessage.tx_id}</p>
                                  </div>
                                )}
                                {websocketMessage.block_height && (
                                  <div>
                                    <span className="font-medium">Block Height:</span>
                                    <p className="mt-1">{websocketMessage.block_height.toLocaleString()}</p>
                                  </div>
                                )}
                                {websocketMessage.block_time_iso && (
                                  <div>
                                    <span className="font-medium">Block Time:</span>
                                    <p className="mt-1">{new Date(websocketMessage.block_time_iso).toLocaleString()}</p>
                                  </div>
                                )}
                              </div>
                              {websocketMessage.tx_result && (
                                <div className="mt-3">
                                  <span className="font-medium">Result:</span>
                                  <p className="font-mono mt-1">
                                    {websocketMessage.tx_result.repr || websocketMessage.tx_result.hex}
                                  </p>
                                </div>
                              )}
                              <details className="mt-3">
                                <summary className="cursor-pointer hover:underline text-sm text-gray-600">
                                  View raw WebSocket data
                                </summary>
                                <pre className="whitespace-pre-wrap text-xs p-3 rounded border mt-2 max-h-48 overflow-auto font-mono">
                                  {JSON.stringify(websocketMessage, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end mt-6">
                          <Button
                            variant="default"
                            onClick={() => {
                              setShowResultDialog(false)
                              setTxStatusView("initial")
                            }}
                          >
                            Close
                          </Button>
                        </div>
                      </>
                    )}
                    {txStatusView === "confirmed-failure" && (
                      <>
                        <DialogHeader>
                          <DialogTitle className="text-xl flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 text-red-700" />
                            Proposal Failed on Blockchain
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            The proposal transaction failed on-chain.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          {parsed?.data?.link && (
                            <div className="flex">
                              <Button asChild>
                                <a
                                  href={parsed.data.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View on Explorer
                                </a>
                              </Button>
                            </div>
                          )}
                          {websocketMessage && (
                            <div className="border rounded-lg p-4 ">
                              <h4 className="font-semibold mb-2 text-red-800">❌ Transaction Failed</h4>
                              <div className="text-sm mb-2">
                                <span className="font-medium">Status:</span>{" "}
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {websocketMessage.tx_status?.toUpperCase()}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {websocketMessage.tx_id && (
                                  <div>
                                    <span className="font-medium">Transaction ID:</span>
                                    <p className="font-mono text-xs mt-1 break-all">{websocketMessage.tx_id}</p>
                                  </div>
                                )}
                                {websocketMessage.block_height && (
                                  <div>
                                    <span className="font-medium">Block Height:</span>
                                    <p className="mt-1">{websocketMessage.block_height.toLocaleString()}</p>
                                  </div>
                                )}
                                {websocketMessage.block_time_iso && (
                                  <div>
                                    <span className="font-medium">Block Time:</span>
                                    <p className="mt-1">{new Date(websocketMessage.block_time_iso).toLocaleString()}</p>
                                  </div>
                                )}
                              </div>
                              {websocketMessage.tx_result && (
                                <div className="mt-3">
                                  <span className="font-medium">Error Details:</span>
                                  <p className="font-mono mt-1">
                                    {(() => {
                                      const raw = websocketMessage.tx_result.repr || websocketMessage.tx_result.hex
                                      const match = raw.match(/u?(\d{4,})/)
                                      if (match) {
                                        const code = Number.parseInt(match[1], 10)
                                        const description = errorCodeMap[code]?.description
                                        return description ? description : raw
                                      }
                                      return raw
                                    })()}
                                  </p>
                                </div>
                              )}
                              <details className="mt-3">
                                <summary className="cursor-pointer hover:underline text-sm text-gray-600">
                                  View raw WebSocket data
                                </summary>
                                <pre className="whitespace-pre-wrap text-xs p-3 rounded border mt-2 max-h-48 overflow-auto font-mono">
                                  {JSON.stringify(websocketMessage, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end mt-6">
                          <Button
                            variant="default"
                            onClick={() => {
                              setShowResultDialog(false)
                              setTxStatusView("initial")
                            }}
                          >
                            Close
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )
              })()}
            </>
          ) : (
            // Error state (API/network)
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Proposal Submission Failed
                </DialogTitle>
                <DialogDescription className="text-base">
                  There was an error processing your DAO proposal.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <div className="bg-muted border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Error Details</h4>
                  <div className="text-sm">{apiResponse?.error || "An unknown error occurred"}</div>
                  {apiResponse?.output && (
                    <details className="mt-3">
                      <summary className="cursor-pointer hover:underline">View full response</summary>
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
                  onClick={() => {
                    setShowResultDialog(false)
                    setTxStatusView("initial")
                  }}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
