"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageList } from "@/components/chat/message-list";
import AgentWalletSelector from "@/components/chat/agent-selector";
import { CreateThreadButton } from "@/components/threads/CreateThreadButton";
import { useChatStore } from "@/store/chat";
import { useSessionStore } from "@/store/session";
import { fetchDAOExtensions, fetchToken } from "@/queries/daoQueries";
import type { DAO, Token, Extension } from "@/types/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DAOChatModalProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DAOChatModal({
  daoId,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  token,
}: DAOChatModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  // Use either controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = setControlledOpen || setUncontrolledOpen;

  const {
    messages,
    isLoading: isChatLoading,
    error: chatError,
    isConnected,
    selectedAgentId,
    setSelectedAgent,
    connect,
    activeThreadId,
  } = useChatStore();

  const { accessToken } = useSessionStore();
  const threadMessages = activeThreadId ? messages[activeThreadId] || [] : [];

  const { data: daoExtensions, isLoading: isExtensionsLoading } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 600000, // 10 minutes
    enabled: open, // Only fetch when modal is open
  });

  const { data: tokenData, isLoading: isTokenLoading } = useQuery({
    queryKey: ["token", daoId],
    queryFn: () => fetchToken(daoId),
    staleTime: 600000, // 10 minutes
    enabled: open && !token, // Only fetch when modal is open and token is not provided
  });

  const memoizedConnect = useCallback(
    (token: string) => {
      if (!isConnected && token) {
        console.log("Attempting to connect...");
        connect(token);
      }
    },
    [connect, isConnected]
  );

  useEffect(() => {
    if (!accessToken || !open) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isConnected) {
        memoizedConnect(accessToken);
      }
    };

    // Initial connection
    memoizedConnect(accessToken);

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [accessToken, memoizedConnect, isConnected, open]);

  const renderChatSection = () => {
    if (!accessToken) {
      return (
        <div className="flex items-center justify-center h-full">
          Please sign in to start chatting
        </div>
      );
    }

    if (!activeThreadId) {
      return (
        <div className="flex items-center justify-center h-full backdrop-blur-sm">
          <div className="text-center space-y-4 p-4 -mt-20">
            <div className="flex justify-center gap-3">
              <CreateThreadButton />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header - fixed height */}
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 shadow-md bg-background z-10">
          <div className="flex items-center gap-2  min-w-0 flex-1">
            <div>
              <AgentWalletSelector
                selectedAgentId={selectedAgentId}
                onSelect={setSelectedAgent}
                disabled={isChatLoading || !isConnected}
              />
            </div>
          </div>

          <div className="flex-shrink-0 ml-2">
            <CreateThreadButton />
          </div>
        </div>

        {/* Middle scrollable area - takes remaining space */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            {chatError && (
              <Alert variant="destructive" className="my-2">
                <AlertDescription>{chatError}</AlertDescription>
              </Alert>
            )}
            <MessageList messages={threadMessages} />
          </div>
        </div>

        {/* Footer - fixed height */}
        <div className="sticky bottom-0 w-full min-w-0 pb-safe shadow-lg z-20">
          <ChatInput
            selectedAgentId={selectedAgentId}
            onAgentSelect={setSelectedAgent}
            disabled={isChatLoading || !isConnected}
          />
        </div>
      </div>
    );
  };

  // Get token symbol
  const tokenName = tokenData?.symbol || "DAO";

  const EXTENSION_PROMPTS: Record<string, (extension: Extension) => string> = {
    // NEW TYPES
    TOKEN_DEX: (extension) =>
      `Buy 5 million of ${tokenName}.\n
  Token DEX: ${extension.contract_principal}`,

    EXTENSIONS_CORE_PROPOSALS: (extension) =>
      `Submit a new proposal to modify the ${tokenName} DAO's governance structure.\n
  Core Proposals extension: ${extension.contract_principal}`,

    EXTENSIONS_ACTION_PROPOSALS: (extension) =>
      `Propose an action to update a smart contract in the ${tokenName} DAO.\n
  Action Proposals extension: ${extension.contract_principal}`,

    EXTENSIONS_TREASURY: (extension) =>
      `Allocate ${tokenName} DAO funds for a specific initiative.\n
  Treasury extension: ${extension.contract_principal}`,

    ACTIONS_TREASURY_ALLOW_ASSET: (extension) =>
      `Whitelist a new asset in the ${tokenName} DAO treasury.\n
  Treasury Allow Asset extension: ${extension.contract_principal}`,

    EXTENSIONS_MESSAGING: (extension) =>
      `Draft a proposal to notify ${tokenName} DAO members about an upcoming vote.\n
  Messaging extension: ${extension.contract_principal}`,

    ACTIONS_MESSAGING_SEND_MESSAGE: (extension) =>
      `Announce important information to all ${tokenName} DAO members.\n
  Messaging Send Message extension: ${extension.contract_principal}`,

    EXTENSIONS_PAYMENTS: (extension) =>
      `Schedule a payment for ${tokenName} DAO operations.\n
  Payments extension: ${extension.contract_principal}`,

    EXTENSIONS_CHARTER: (extension) =>
      `Show the current charter of the ${tokenName} DAO.\n
  Charter extension: ${extension.contract_principal}`,

    EXTENSIONS_TOKEN_OWNER: (extension) =>
      `Execute a token owner action for ${tokenName}.\n
  Token Owner extension: ${extension.contract_principal}`,

    ACTIONS_BANK_ACCOUNT_SET_WITHDRAWAL_AMOUNT: (extension) =>
      `Set a withdrawal amount of 1000 ${tokenName} tokens.\n
  Bank Account Set Withdrawal Amount extension: ${extension.contract_principal}`,

    ACTIONS_BANK_ACCOUNT_SET_WITHDRAWAL_PERIOD: (extension) =>
      `Update the withdrawal period for the ${tokenName} DAO bank account to 30 days.\n
  Bank Account Set Withdrawal Period extension: ${extension.contract_principal}`,

    ACTIONS_BANK_ACCOUNT_SET_ACCOUNT_HOLDER: (extension) =>
      `Change the account holder for the ${tokenName} DAO bank account.\n
  Bank Account Set Account Holder extension: ${extension.contract_principal}`,

    EXTENSIONS_BANK_ACCOUNT: (extension) =>
      `Show the current ${tokenName} DAO bank account details.\n
  Bank Account extension: ${extension.contract_principal}`,

    ACTIONS_PAYMENTS_INVOICES_TOGGLE_RESOURCE: (extension) =>
      `Toggle payment resource availability for ${tokenName} DAO invoices.\n
  Payments Invoices Toggle Resource extension: ${extension.contract_principal}`,

    ACTIONS_PAYMENTS_INVOICES_ADD_RESOURCE: (extension) =>
      `Add a new payment resource for ${tokenName} DAO invoices.\n
  Payments Invoices Add Resource extension: ${extension.contract_principal}`,

    PROPOSALS_BOOTSTRAP_INIT: (extension) =>
      `Initialize the bootstrap process for ${tokenName} DAO.\n
  Proposals Bootstrap Init extension: ${extension.contract_principal}`,

    TOKEN_POOL: (extension) =>
      `Manage the ${tokenName} token pool parameters.\n
  Token Pool extension: ${extension.contract_principal}`,

    TOKEN_DAO: (extension) =>
      `Vote yes on proposal 5 in the ${tokenName} DAO.\n
  Voting extension: ${extension.contract_principal}`,

    BASE_DAO: (extension) =>
      `Access base DAO functions for ${tokenName}.\n
  Base DAO extension: ${extension.contract_principal}`,

    // OLD TYPES
    pool: (extension) =>
      `Manage liquidity pool operations for ${tokenName}.\n
  Pool extension: ${extension.contract_principal}`,

    "aibtc-token-owner": (extension) =>
      `Execute token owner actions for ${tokenName}.\n
  Token Owner extension: ${extension.contract_principal}`,

    "aibtc-action-proposals": (extension) =>
      `Submit an action proposal for ${tokenName} DAO.\n
  Action Proposals extension: ${extension.contract_principal}`,

    "aibtc-payments-invoices": (extension) =>
      `Process a payment invoice for ${tokenName} DAO.\n
  Payments Invoices extension: ${extension.contract_principal}`,

    "aibtc-treasury": (extension) =>
      `Propose a treasury management action for ${tokenName} DAO.\n
  Treasury extension: ${extension.contract_principal}`,

    "aibtc-bank-account": (extension) =>
      `Interact with the ${tokenName} DAO's bank account.\n
  Bank Account extension: ${extension.contract_principal}`,

    "aibtc-onchain-messaging": (extension) =>
      `Send an on-chain message to ${tokenName} DAO members.\n
  Messaging extension: ${extension.contract_principal}`,

    "aibtc-base-bootstrap-initialization": (extension) =>
      `Initialize ${tokenName} DAO bootstrap process.\n
  Bootstrap extension: ${extension.contract_principal}`,

    "aibtc-core-proposals": (extension) =>
      `Submit a core proposal for ${tokenName} DAO governance.\n
  Core Proposals extension: ${extension.contract_principal}`,

    "aibtcdev-base-dao": (extension) =>
      `Interact with the ${tokenName} base DAO development framework.\n
  Base DAO extension: ${extension.contract_principal}`,
  };

  const generatePrompt = (extension: Extension) => {
    // Check for exact match or variations of the type
    const promptGenerator =
      EXTENSION_PROMPTS[extension.type] ||
      EXTENSION_PROMPTS[extension.type.toUpperCase()] ||
      EXTENSION_PROMPTS[extension.type.toLowerCase()];

    return promptGenerator ? promptGenerator(extension) : "";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPrompt(text);
      setTimeout(() => setCopiedPrompt(null), 2000);
    });
  };

  const renderPromptsSection = () => {
    if (isExtensionsLoading || isTokenLoading) {
      return (
        <div className="flex justify-center items-center h-full w-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // Filter out extensions that would generate empty prompts
    const validExtensions = daoExtensions
      ? daoExtensions.filter((extension: Extension) => {
          const prompt = generatePrompt(extension);
          return prompt.trim() !== "";
        })
      : [];

    return (
      <div className="flex flex-col h-full">
        {/* Header - fixed height */}
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 shadow-md bg-background z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate">
              Sample Prompts To Interact with {tokenName} DAO
            </h2>
          </div>
        </div>

        {/* Middle scrollable area - takes remaining space */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-4">
            {validExtensions.length > 0 ? (
              validExtensions.map((extension: Extension) => (
                <div
                  key={extension.id}
                  className="bg-background/50 backdrop-blur-sm p-3 rounded-lg border relative group"
                >
                  <p className="text-sm text-muted-foreground pr-8">
                    {generatePrompt(extension)}
                  </p>
                  <button
                    onClick={() => copyToClipboard(generatePrompt(extension))}
                    className="absolute top-2 right-2 p-1 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {copiedPrompt === generatePrompt(extension) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No active extensions found.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] p-0 rounded-lg">
        <DialogTitle className="sr-only">
          {tokenName} DAO Chat and Interaction Examples
        </DialogTitle>
        <DialogDescription className="sr-only">
          Chat with your agent and see examples of how to interact with your
          {tokenName} DAO&apos;s extensions
        </DialogDescription>
        <div className="h-full overflow-hidden">
          {/* Desktop view */}
          <div className="hidden md:grid md:grid-cols-2 h-full">
            {/* Chat Section - Left Side */}
            <div className="h-full border-r flex flex-col overflow-auto">
              {renderChatSection()}
            </div>

            {/* Prompts Section - Right Side */}
            <div className="h-full flex flex-col overflow-auto">
              {renderPromptsSection()}
            </div>
          </div>

          {/* Mobile view */}
          <div className="md:hidden h-full">
            <Tabs defaultValue="chat" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="prompts">Examples</TabsTrigger>
              </TabsList>
              <TabsContent value="chat" className="flex-1 overflow-auto">
                {renderChatSection()}
              </TabsContent>
              <TabsContent value="prompts" className="flex-1 overflow-auto">
                {renderPromptsSection()}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
