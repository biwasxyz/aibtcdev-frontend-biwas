"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/session";
import { ChatWindow } from "@/components/chat/chat-window";
import { Loader } from "@/components/reusables/loader";

export default function ChatPage() {
  const { accessToken, isLoading, initialize } = useSessionStore();

  // Initialize session when component mounts
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500">Please sign in to start chatting</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <ChatWindow />
    </div>
  );
}
