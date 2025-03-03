"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageList } from "@/components/chat/message-list";
import AgentWalletSelector from "@/components/chat/agent-selector";
import { CreateThreadButton } from "@/components/threads/CreateThreadButton";
import { useChatStore } from "@/store/chat";
import { useSessionStore } from "@/store/session";
import { fetchProposals } from "@/queries/daoQueries";
import DAOProposals from "@/components/daos/dao-proposals";
import type { DAO, Token } from "@/types/supabase";

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
  dao,
  token,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: DAOChatModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

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

  const { data: proposals, isLoading: isProposalsLoading } = useQuery({
    queryKey: ["proposals", daoId],
    queryFn: () => fetchProposals(daoId),
    staleTime: 1000000,
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
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4 p-4">
            <div className="flex justify-center gap-3">
              <CreateThreadButton />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-4 h-14 backdrop-blur-sm shadow-sm z-10">
          <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
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

        {/* Message list */}
        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col justify-end min-h-full w-full p-4">
            {chatError && (
              <Alert variant="destructive" className="my-2">
                <AlertDescription>{chatError}</AlertDescription>
              </Alert>
            )}
            <MessageList messages={threadMessages} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="sticky bottom-0 w-full p-4 bg-background/80 backdrop-blur-sm border-t">
          <ChatInput
            selectedAgentId={selectedAgentId}
            onAgentSelect={setSelectedAgent}
            disabled={isChatLoading || !isConnected}
          />
        </div>
      </div>
    );
  };

  const renderProposalsSection = () => {
    if (isProposalsLoading) {
      return (
        <div className="flex justify-center items-center min-h-[200px] w-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="p-4">
        {dao && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{dao.name}</h2>
            {token && (
              <div className="text-sm text-muted-foreground mb-2">
                Token: ${token.symbol}
              </div>
            )}
            <p className="text-sm text-muted-foreground">{dao.mission}</p>
          </div>
        )}
        <DAOProposals proposals={proposals || []} />
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
      <DialogContent className="max-w-[90vw] w-[90vw] h-[85vh] p-0">
        <div className="flex h-full">
          {/* Chat Section - Left Side */}
          <div className="w-1/2 h-full border-r">{renderChatSection()}</div>

          {/* Separator */}
          <Separator orientation="vertical" />

          {/* Proposals Section - Right Side */}
          <div className="w-1/2 h-full overflow-auto">
            {renderProposalsSection()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
