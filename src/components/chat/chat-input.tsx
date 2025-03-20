"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat";
import { useSessionStore } from "@/store/session";

interface ChatInputProps {
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string | null) => void;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export function ChatInput({
  disabled = false,
  value,
  onChange,
}: ChatInputProps) {
  const [input, setInput] = useState(value || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { sendMessage, activeThreadId } = useChatStore();
  const { accessToken } = useSessionStore();

  // Update input when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInput(value);
      // Adjust textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          200
        )}px`;
      }
    }
  }, [value]);

  // Handle mobile keyboard resize
  useEffect(() => {
    const handleResize = () => {
      if (textareaRef.current && window.visualViewport) {
        const viewport = window.visualViewport;
        textareaRef.current.style.maxHeight = `${viewport.height * 0.4}px`;

        // Scroll input into view when keyboard appears
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ block: "end" });
        }
      }
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    return () =>
      window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !accessToken || !activeThreadId) return;

      try {
        sendMessage(activeThreadId, input.trim());
        setInput("");
        onChange?.(""); // Notify parent of empty input
        textareaRef.current?.style.setProperty("height", "auto");
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [activeThreadId, input, sendMessage, accessToken, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInput(newValue);
      onChange?.(newValue);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          200
        )}px`;
      }
    },
    [onChange]
  );

  const handleFocus = () => {
    // Mobile scroll fix
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 300);
  };

  if (!accessToken) return null;

  return (
    <div ref={containerRef} className="w-full backdrop-blur">
      <div className="mx-auto max-w-5xl px-2 md:px-4 py-2 w-full">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <div className="flex flex-1 gap-2 items-end w-full">
            <div className="relative flex-1 min-w-0">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onClick={handleFocus}
                onFocus={handleFocus}
                placeholder="Type a message..."
                disabled={disabled}
                className={cn(
                  "min-h-[44px] h-11 max-h-[200px] resize-none w-full",
                  "py-2.5 px-4 border border-muted",
                  "text-base placeholder:text-muted-foreground",
                  "rounded-xl md:rounded-2xl",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "transition-all duration-200",
                  "scroll-pb-2"
                )}
                rows={1}
              />
            </div>
            <Button
              type="submit"
              disabled={disabled || !input.trim()}
              className="h-11 w-11 rounded-full p-0 flex-shrink-0 mb-1"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
