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
import { fetchDAOExtensions } from "@/queries/daoQueries";
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
          <Alert>
            <AlertDescription>
              Please sign in to start chatting
            </AlertDescription>
          </Alert>
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
        <div className="flex-shrink-0 h-20 border-t px-4 py-3 bg-background z-10">
          <ChatInput
            selectedAgentId={selectedAgentId}
            onAgentSelect={setSelectedAgent}
            disabled={isChatLoading || !isConnected}
          />
        </div>
      </div>
    );
  };

  const EXTENSION_PROMPTS: Record<string, (extension: Extension) => string> = {
    // NEW TYPES
    TOKEN_DEX: (extension) =>
      `Buy 1 million satoshis of ${extension.contract_principal}. Ensure you have sufficient balance before proceeding.`,
    EXTENSIONS_CORE_PROPOSALS: (extension) =>
      `Submit a new proposal to modify the DAO's governance structure using ${extension.contract_principal}. Provide a clear rationale and expected benefits.`,
    EXTENSIONS_ACTION_PROPOSALS: (extension) =>
      `Propose an action to update or upgrade a smart contract using ${extension.contract_principal}. Include the reason and expected impact of this upgrade.`,
    EXTENSIONS_TREASURY: (extension) =>
      `Submit a proposal to allocate DAO funds for a specific initiative using ${extension.contract_principal}. Specify the amount and justification.`,
    ACTIONS_TREASURY_ALLOW_ASSET: (extension) =>
      `Propose to whitelist a new asset in the DAO treasury through ${extension.contract_principal}. Provide details on why this asset should be allowed.`,
    EXTENSIONS_MESSAGING: (extension) =>
      `Draft and send a proposal to notify DAO members about an upcoming vote through ${extension.contract_principal}. Ensure clarity and completeness of information.`,
    ACTIONS_MESSAGING_SEND_MESSAGE: (extension) =>
      `Propose an official DAO-wide announcement via ${extension.contract_principal}. Outline the message content and its importance to members.`,
    EXTENSIONS_PAYMENTS: (extension) =>
      `Submit a proposal to execute a scheduled payment for DAO operations using ${extension.contract_principal}. Detail the amount and recipient.`,

    // OLD TYPES
    pool: (extension) =>
      `Manage liquidity pool operations for ${extension.contract_principal}. Provide details on your pooling strategy.`,
    "aibtc-token-owner": (extension) =>
      `Execute token owner actions for ${extension.contract_principal}. Outline the specific management task.`,
    "aibtc-action-proposals": (extension) =>
      `Submit an action proposal using ${extension.contract_principal}. Describe the proposed action and its rationale.`,
    "aibtc-payments-invoices": (extension) =>
      `Process a payment invoice through ${extension.contract_principal}. Provide invoice details and justification.`,
    "aibtc-treasury": (extension) =>
      `Propose a treasury management action for ${extension.contract_principal}. Specify the financial operation.`,
    "aibtc-bank-account": (extension) =>
      `Interact with the DAO's bank account using ${extension.contract_principal}. Describe the intended transaction.`,
    "aibtc-onchain-messaging": (extension) =>
      `Send an on-chain message via ${extension.contract_principal}. Craft a clear and concise communication.`,
    "aibtc-base-bootstrap-initialization": (extension) =>
      `Initialize DAO bootstrap process using ${extension.contract_principal}. Outline the initialization steps.`,
    "aibtc-core-proposals": (extension) =>
      `Submit a core proposal for DAO governance using ${extension.contract_principal}. Provide comprehensive details.`,
    "aibtcdev-base-dao": (extension) =>
      `Interact with the base DAO development framework using ${extension.contract_principal}. Specify your development intent.`,
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
    if (isExtensionsLoading) {
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
              Sample Prompts To Interact with DAO
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
          DAO Chat and Interaction Examples
        </DialogTitle>
        <DialogDescription className="sr-only">
          Chat with your agent and see examples of how to interact with your
          DAO&apos;s extensions
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
