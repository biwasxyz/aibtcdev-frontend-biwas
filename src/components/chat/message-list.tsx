"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/lib/chat/types";
import { ChatMessageBubble } from "./chat-message-bubble";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const lastMessageLengthRef = useRef(0);

  // Handle auto-scrolling based on message changes
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    // Enable auto-scroll when user sends a message
    if (lastMessage?.role === "user") {
      setShouldAutoScroll(true);
    }

    // Disable auto-scroll when we receive a completion message
    if (
      lastMessage?.type === "completion" &&
      lastMessage.status === "complete"
    ) {
      setShouldAutoScroll(false);
    }

    // If auto-scroll is enabled, scroll to bottom
    if (shouldAutoScroll && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "instant" });
    }

    lastMessageLengthRef.current = messages.length;
  }, [messages, shouldAutoScroll]);

  // Group messages for streaming
  const groupedMessages = messages.reduce<Message[]>((acc, message) => {
    const lastMessage = acc[acc.length - 1];

    // Handle token messages
    if (message.type === "token") {
      // If we have a processing or planning token message, append to it
      if (
        lastMessage?.type === "token" &&
        (lastMessage.status === "processing" ||
          lastMessage.status === "planning")
      ) {
        lastMessage.content =
          (lastMessage.content || "") + (message.content || "");
        if (message.status === "complete" || message.status === "end") {
          lastMessage.status = message.status;
        }
        return acc;
      }

      // Start a new token message
      if (
        message.status === "processing" ||
        message.status === "planning" ||
        message.status === "complete" ||
        message.status === "end"
      ) {
        acc.push({
          ...message,
          content: message.content || "",
          role: message.role || "assistant",
        });
      }
      return acc;
    }

    // Handle step messages with planning status
    if (message.type === "step" && message.status === "planning") {
      // If we have a planning step message, append to it
      if (lastMessage?.type === "step" && lastMessage.status === "planning") {
        lastMessage.content =
          (lastMessage.content || "") + (message.content || "");
        return acc;
      }

      // Start a new planning message
      acc.push({
        ...message,
        content: message.content || "",
        role: message.role || "assistant",
      });
      return acc;
    }

    acc.push(message);
    return acc;
  }, []);

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col space-y-3 p-2 w-full md:w-[90%] md:mx-auto min-w-0">
        {groupedMessages.map((message, index) => (
          <div
            key={index}
            ref={index === groupedMessages.length - 1 ? lastMessageRef : null}
            className="w-full min-w-0 break-words"
          >
            <ChatMessageBubble message={message} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
