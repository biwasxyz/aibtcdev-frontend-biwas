"use client";

import { useRef } from "react";
import type { Message } from "@/lib/chat/types";
import { ChatMessageBubble } from "./chat-message-bubble";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const lastMessageRef = useRef<HTMLDivElement>(null);

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
      <div className="flex flex-col space-y-3 p-2 max-w-full mx-auto">
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
