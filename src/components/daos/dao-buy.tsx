"use client";

import type React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session";

interface TokenBuyInputProps {
  tokenName: string;
  contractPrincipal: string;
  disabled?: boolean;
  onSend: () => void;
  initialAmount?: string;
  onAmountChange?: (amount: string) => void;
}

export function TokenBuyInput({
  tokenName,
  contractPrincipal,
  disabled = false,
  onSend,
  initialAmount = "",
  onAmountChange,
}: TokenBuyInputProps) {
  const [amount, setAmount] = useState(initialAmount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
      if (!amount.trim() || !accessToken) return;

      setIsLoading(true);
      setError(null);

      try {
        // Convert satoshis to BTC for the API request
        const btcAmount = (Number(amount) / 100000000).toString();

        console.log("Sending request with:", {
          btc_amount: btcAmount,
          dao_token_dex_contract_address: contractPrincipal,
          slippage: "15",
        });

        // Call the FastAPI endpoint with token as a query parameter
        const response = await fetch(
          `https://core-staging.aibtc.dev/tools/faktory/execute_buy?token=${encodeURIComponent(
            accessToken
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              btc_amount: btcAmount,
              dao_token_dex_contract_address: contractPrincipal,
              slippage: "15", // Default slippage of 0.15%
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to execute buy order");
        }

        // Reset amount and call onSend callback
        setAmount("");
        onSend(); // Call the onSend callback after successful transaction
      } catch (error) {
        console.error("Failed to execute buy order:", error);
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [amount, contractPrincipal, accessToken, onSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow numbers and decimal points
      const value = e.target.value.replace(/[^\d.]/g, "");
      setAmount(value);

      // Clear any previous errors when user types
      if (error) setError(null);

      // Notify parent component about the amount change
      if (onAmountChange) {
        onAmountChange(value);
      }
    },
    [onAmountChange, error]
  );

  const handleFocus = () => {
    // Mobile scroll fix
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 300);
  };

  if (!accessToken) return null;

  // Convert satoshis to BTC for display
  const satoshiToBTC = (satoshis: string) => {
    if (!satoshis || isNaN(Number(satoshis))) return "0.00000000";
    return (Number(satoshis) / 100000000).toFixed(8);
  };

  const btcValue = satoshiToBTC(amount);

  return (
    <div
      ref={containerRef}
      className="w-full backdrop-blur bg-background/95 border-t border-border"
    >
      <div className="mx-auto max-w-5xl px-2 md:px-4 py-3 w-full">
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
          <div className="text-md text-muted-foreground text-right px-1 text-orange-500">
            {amount ? `${btcValue} BTC` : "0 BTC"}
          </div>
          <div className="flex flex-1 gap-2 items-center w-full">
            <div className="relative flex-1 min-w-0">
              <div className="flex items-center relative">
                <Input
                  ref={inputRef}
                  type="text"
                  value={amount}
                  onChange={handleChange}
                  onClick={handleFocus}
                  onFocus={handleFocus}
                  placeholder={`Enter satoshi amount to spend on ${tokenName}...`}
                  disabled={disabled || isLoading}
                  className={cn(
                    "h-11 pr-16",
                    "py-2.5 px-4 border border-muted",
                    "text-base placeholder:text-muted-foreground",
                    "rounded-xl md:rounded-2xl",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "transition-all duration-200"
                  )}
                />
                <div className="absolute right-3 flex items-center gap-1 pointer-events-none">
                  <span className="text-sm font-medium text-muted-foreground text-orange-500">
                    sats
                  </span>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={disabled || isLoading || !amount.trim()}
              className="h-11 px-4"
            >
              {isLoading ? (
                <>
                  <span className="animate-pulse">Processing...</span>
                </>
              ) : (
                <>
                  Buy
                  <Wallet className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
