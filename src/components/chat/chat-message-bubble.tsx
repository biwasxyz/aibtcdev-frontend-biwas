"use client";

import { cn } from "@/lib/utils";
import { Clock, User, Terminal, ChevronDown } from "lucide-react";
import type { Message } from "@/lib/chat/types";
import { useAgent } from "@/hooks/use-agent";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { memo, useState } from "react";
import type { Agent } from "@/types/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// Separate AgentAvatar into its own memoized component
const AgentAvatar = memo(({ agent }: { agent: Agent | null }) => {
  const shouldShowOverlay =
    agent?.name && agent.name.toLowerCase() !== "assistant";

  return (
    <Avatar className="h-6 w-6 relative">
      {agent?.image_url ? (
        <AvatarImage
          src={agent.image_url}
          alt={agent?.name || "Bot"}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback>
        <Image
          src="/logos/aibtcdev-avatar-1000px.png"
          alt="AI BTC Dev"
          width={24}
          height={24}
        />
      </AvatarFallback>
      {shouldShowOverlay && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <span className="text-sm font-bold text-white">
            {agent.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </Avatar>
  );
});
AgentAvatar.displayName = "AgentAvatar";

// Custom components for markdown rendering
export const MarkdownComponents: Components = {
  p: ({ children, ...props }) => (
    <p className="mb-2 last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc pl-4 mb-2 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal pl-4 mb-2 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="marker:text-zinc-500" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  code: ({ children, ...props }) => (
    <code
      className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-xs sm:text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-2 border-zinc-500 pl-4 italic" {...props}>
      {children}
    </blockquote>
  ),
};

// Memoize the entire ChatMessageBubble component
export const ChatMessageBubble = memo(({ message }: { message: Message }) => {
  const { agent } = useAgent(
    message.type === "tool" || message.role === "assistant"
      ? message.agent_id
      : null
  );
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "flex w-full gap-2 px-2 py-1 group min-w-0",
        message.role === "user" && message.type !== "tool"
          ? "flex-row-reverse"
          : ""
      )}
    >
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-full",
          message.type === "tool" || message.role === "assistant"
            ? "bg-zinc-700 text-zinc-300"
            : "bg-blue-600 text-white"
        )}
      >
        {message.type === "tool" || message.role === "assistant" ? (
          <AgentAvatar agent={agent} />
        ) : (
          <User className="h-5 w-5" />
        )}
      </div>
      <div
        className={cn(
          "flex flex-col min-w-0 space-y-1",
          message.role === "user" && message.type !== "tool"
            ? "items-end"
            : "items-start",
          "max-w-[85%] sm:max-w-[75%] w-fit"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3 py-2 w-fit sm:max-w-full max-w-[200px]",
            message.role === "user" && message.type !== "tool"
              ? "bg-blue-600 text-white"
              : message.status === "planning"
              ? "bg-indigo-900 text-zinc-200"
              : "bg-zinc-800 text-zinc-200"
          )}
        >
          {message.type === "tool" && message.tool && (
            <>
              <div
                className={cn(
                  "text-xs sm:text-sm font-medium mb-1 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity",
                  message.role === "user" ? "text-blue-100" : "text-indigo-400"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>{message.tool}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    isExpanded ? "transform rotate-180" : ""
                  )}
                />
              </div>
              {isExpanded && (
                <div className="mt-2 space-y-2 text-xs sm:text-sm">
                  {message.tool_input && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-indigo-400/70">
                        Input
                      </div>
                      <div className="bg-black/20 rounded p-2 overflow-x-auto">
                        <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-words font-mono">
                          {typeof message.tool_input === "string"
                            ? message.tool_input
                            : JSON.stringify(message.tool_input, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  {message.tool_output && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-indigo-400/70">
                        Output
                      </div>
                      <div className="bg-black/20 rounded p-2 overflow-x-auto">
                        <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-words font-mono">
                          {typeof message.tool_output === "string"
                            ? message.tool_output
                            : JSON.stringify(message.tool_output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {message.type === "step" && message.status === "planning" ? (
            <div
              className="flex flex-col w-full cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center justify-between w-full text-indigo-300">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm sm:text-base font-medium">
                    Thought for few seconds
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isExpanded ? "transform rotate-180" : ""
                  )}
                />
              </div>
              {!isExpanded && (
                <span className="text-xs sm:text-sm text-indigo-300/70 mt-0.5">
                  Tap to see planning details
                </span>
              )}
            </div>
          ) : null}
          {(!message.type ||
            message.type !== "step" ||
            message.status !== "planning" ||
            isExpanded) && (
            <div
              className={cn(
                "text-xs sm:text-sm md:text-md leading-relaxed break-words [&>*:last-child]:mb-0",
                message.type === "step" && message.status === "planning"
                  ? "mt-2"
                  : ""
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ...MarkdownComponents,
                  p: ({ children, ...props }) => (
                    <p className="mb-2 last:mb-0 break-words" {...props}>
                      {children}
                    </p>
                  ),
                  pre: ({ children, ...props }) => (
                    <pre
                      className="overflow-x-auto break-words bg-black/20 rounded p-2 my-2"
                      {...props}
                    >
                      {children}
                    </pre>
                  ),
                  code: ({ children, ...props }) => (
                    <code
                      className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-xs sm:text-sm font-mono break-words"
                      {...props}
                    >
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content || ""}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {message.created_at && (
          <div
            className={cn(
              "flex items-center gap-1.5 px-1",
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {/* <p className="text-sm text-zinc-500">
              {new Date(message.created_at).toLocaleTimeString()}
            </p> */}
          </div>
        )}
      </div>
    </div>
  );
});
ChatMessageBubble.displayName = "ChatMessageBubble";
