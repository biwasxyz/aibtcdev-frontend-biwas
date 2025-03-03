"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  const renderProposalsSection = () => {
    if (isProposalsLoading) {
      return (
        <div className="flex justify-center items-center h-full w-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header - fixed height */}
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 shadow-md bg-background z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate">
              {dao?.name || "DAO Information"}
            </h2>
          </div>
          {token && (
            <div className="text-sm text-muted-foreground">
              Token: ${token.symbol}
            </div>
          )}
        </div>

        {/* Middle scrollable area - takes remaining space */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              {dao?.mission || "DAO mission and details will appear here."}
            </p>
            <DAOProposals proposals={proposals || []} />
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
        <div className="grid grid-cols-2 h-full overflow-hidden">
          {/* Chat Section - Left Side */}
          <div className="h-full border-r flex flex-col overflow-auto">
            {renderChatSection()}
          </div>

          {/* Proposals Section - Right Side */}
          <div className="h-full flex flex-col overflow-auto">
            {renderProposalsSection()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
