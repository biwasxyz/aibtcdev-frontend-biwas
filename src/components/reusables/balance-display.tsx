"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatNumber } from "@/helpers/format-utils";

interface BalanceDisplayProps {
  value: string | number;
  symbol?: string;
  decimals?: number;
  variant?: "raw" | "rounded" | "abbreviated";
  className?: string;
}

/**
 * A reusable component for displaying cryptocurrency balances with consistent formatting
 */
export function BalanceDisplay({
  value,
  symbol = "",
  decimals = 6,
  variant = "raw",
  className = "",
}: BalanceDisplayProps) {
  // Convert value to number and handle potential errors
  const numericValue =
    typeof value === "string" ? Number.parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return <span className={className}>0 {symbol}</span>;
  }

  // Format the raw balance (always used in tooltips)
  const rawBalance = numericValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const rawDisplay = `${rawBalance} ${symbol}`;

  // For raw variant, just return the formatted value
  if (variant === "raw") {
    return <span className={`font-mono ${className}`}>{rawDisplay}</span>;
  }

  // For rounded variant, show fewer decimal places
  if (variant === "rounded") {
    const roundedBalance = numericValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`font-mono ${className}`}>
              {roundedBalance} {symbol}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono">{rawDisplay}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // For abbreviated variant, use K, M, B suffixes
  if (variant === "abbreviated") {
    const abbreviatedBalance = formatNumber(numericValue);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`font-mono ${className}`}>
              {abbreviatedBalance} {symbol}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono">{rawDisplay}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback
  return <span className={`font-mono ${className}`}>{rawDisplay}</span>;
}

/**
 * Specialized component for displaying STX balances
 */
export function StxBalance({
  value,
  variant = "raw",
  className = "",
}: Omit<BalanceDisplayProps, "symbol" | "decimals">) {
  // Convert from microSTX to STX
  const stxValue =
    typeof value === "string"
      ? Number.parseFloat(value) / 1_000_000
      : value / 1_000_000;

  return (
    <BalanceDisplay
      value={stxValue}
      symbol="STX"
      decimals={6}
      variant={variant}
      className={className}
    />
  );
}

/**
 * Specialized component for displaying BTC balances
 */
export function BtcBalance({
  value,
  variant = "raw",
  className = "",
}: Omit<BalanceDisplayProps, "symbol" | "decimals">) {
  // Convert from satoshis to BTC
  const btcValue =
    typeof value === "string"
      ? Number.parseFloat(value) / 100_000_000
      : value / 100_000_000;

  return (
    <BalanceDisplay
      value={btcValue}
      symbol="BTC"
      decimals={8}
      variant={variant}
      className={`${
        variant === "raw" ? "text-primary font-semibold" : ""
      } ${className}`}
    />
  );
}

/**
 * Specialized component for displaying token balances
 */
export function TokenBalance({
  value,
  symbol,
  decimals = 8,
  variant = "raw",
  className = "",
}: BalanceDisplayProps) {
  // Convert from microunits to token units (default divisor for most tokens)
  const divisor = Math.pow(10, decimals);
  const tokenValue =
    typeof value === "string"
      ? Number.parseFloat(value) / divisor
      : value / divisor;

  return (
    <BalanceDisplay
      value={tokenValue}
      symbol={symbol}
      decimals={decimals}
      variant={variant}
      className={className}
    />
  );
}
