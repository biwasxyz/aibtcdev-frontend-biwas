"use client";

import type React from "react";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat";
import { useSessionStore } from "@/store/session";

interface TokenBuyInputProps {
  tokenName: string;
  contractPrincipal: string;
  disabled?: boolean;
  onSend: () => void;
  initialAmount?: string;
}

export function TokenBuyInput({
  tokenName,
  contractPrincipal,
  disabled = false,
  onSend,
  initialAmount = "",
}: TokenBuyInputProps) {
  const [amount, setAmount] = useState(initialAmount);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { sendMessage, activeThreadId } = useChatStore();
  const { accessToken } = useSessionStore();

  useEffect(() => {
    // Update amount when initialAmount prop changes
    if (initialAmount) {
      setAmount(initialAmount);
    }
  }, [initialAmount]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount.trim() || !accessToken || !activeThreadId) return;

      const message = `Buy ${amount} satoshis of ${tokenName}.\nToken DEX: ${contractPrincipal}`;

      try {
        await sendMessage(activeThreadId, message);
        setAmount("");
        onSend(); // Call the onSend callback after successful message send
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [
      activeThreadId,
      amount,
      tokenName,
      contractPrincipal,
      sendMessage,
      accessToken,
      onSend,
    ]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal points
    const value = e.target.value.replace(/[^\d.]/g, "");
    setAmount(value);
  }, []);

  const handleFocus = () => {
    // Mobile scroll fix
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 300);
  };

  if (!accessToken) return null;

  return (
    <div ref={containerRef} className="w-full backdrop-blur">
      <div className="mx-auto max-w-5xl px-2 md:px-4 py-2 w-full">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <div className="flex flex-1 gap-2 items-end w-full">
            <div className="relative flex-1 min-w-0">
              <Input
                ref={inputRef}
                type="text"
                value={amount}
                onChange={handleChange}
                onClick={handleFocus}
                onFocus={handleFocus}
                placeholder={`Enter amount of sats to buy ${tokenName}...`}
                disabled={disabled}
                className={cn(
                  "h-11",
                  "py-2.5 px-4 border border-muted",
                  "text-base placeholder:text-muted-foreground",
                  "rounded-xl md:rounded-2xl",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "transition-all duration-200"
                )}
              />
            </div>
            <Button type="submit" disabled={disabled || !amount.trim()}>
              Buy
              <Wallet className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
