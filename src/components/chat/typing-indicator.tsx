"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { useAgent } from "@/hooks/use-agent";

interface TypingIndicatorProps {
  agentId: string | null;
}

export function TypingIndicator({ agentId }: TypingIndicatorProps) {
  const { agent } = useAgent(agentId);

  return (
    <div className="flex w-full gap-2 px-2 py-1 group min-w-0">
      <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-full bg-zinc-700 text-zinc-300">
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
          {agent?.name && agent.name.toLowerCase() !== "assistant" && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {agent.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Avatar>
      </div>
      <div className="flex flex-col min-w-0 space-y-1 items-start max-w-[85%] sm:max-w-[75%] w-fit">
        <div className="rounded-2xl px-3 py-2 w-fit sm:max-w-full max-w-[200px] bg-zinc-800 text-zinc-200">
          <div className="flex items-center space-x-1">
            <div
              className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
