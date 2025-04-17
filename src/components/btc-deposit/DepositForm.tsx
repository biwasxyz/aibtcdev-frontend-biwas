"use client";

import type React from "react";

import { useState } from "react";
import { Bitcoin, Info, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getStacksAddress, getBitcoinAddress } from "@/lib/address";
import { styxSDK, StyxSDK } from "@faktoryfun/styx-sdk";

export enum TransactionPriority {
  Low = "low",
  Medium = "medium",
  High = "high",
}

export type ConfirmationData = {
  depositAmount: string;
  depositAddress: string;
  stxAddress: string;
  opReturnHex: string;
};

export function DepositForm() {
  const [amount, setAmount] = useState<string>("0.0001");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] =
    useState<ConfirmationData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  // Mock BTC price for USD conversion
  const btcUsdPrice = 65000;

  // Helper functions
  const formatUsdValue = (amount: number): string => {
    if (!amount || amount <= 0) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateUsdValue = (btcAmount: string): number => {
    if (!btcAmount) return 0;
    const numAmount = Number.parseFloat(btcAmount);
    return isNaN(numAmount) ? 0 : numAmount * btcUsdPrice;
  };

  const calculateFee = (btcAmount: string): string => {
    if (!btcAmount || Number.parseFloat(btcAmount) <= 0) return "0.00000000";
    const numAmount = Number.parseFloat(btcAmount);
    if (isNaN(numAmount)) return "0.00000600";
    return numAmount <= 0.002 ? "0.00003000" : "0.00006000";
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setSelectedPreset(null);
    }
  };

  const handlePresetClick = (presetAmount: string) => {
    setAmount(presetAmount);
    setSelectedPreset(presetAmount);
  };

  const handleMaxClick = () => {
    // In a real implementation, this would calculate the max amount based on the user's BTC balance
    // For now, we'll just set a mock value
    const maxAmount = "0.05";
    setAmount(maxAmount);
    setSelectedPreset("max");
  };

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  };

  const prepareTransaction = async () => {
    try {
      setIsLoading(true);

      // Get user addresses
      const userAddress = getStacksAddress();
      const btcAddress = getBitcoinAddress();

      if (!userAddress || !btcAddress) {
        throw new Error("Wallet not connected or addresses not found");
      }

      // This would be your actual SDK call
      const transactionData = await styxSDK.prepareTransaction({
        amount: amount, // BTC amount as string
        userAddress: userAddress, // STX address
        btcAddress: btcAddress, // BTC address
        feePriority: TransactionPriority.Medium,
        walletProvider: "xverse", // "leather" or "xverse"
      });

      console.log("Transaction prepared:", transactionData);

      // Set confirmation data
      setConfirmationData({
        depositAmount: amount,
        depositAddress: transactionData.depositAddress,
        stxAddress: userAddress,
        opReturnHex: transactionData.opReturnData,
      });

      // Show confirmation screen
      setShowConfirmation(true);

      return transactionData;
    } catch (error) {
      console.error("Error preparing transaction:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to prepare transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDeposit = () => {
    setShowConfirmation(false);
    setConfirmationData(null);
  };

  const presetAmounts = ["0.001", "0.005", "0.01"];
  const presetLabels = ["0.001 BTC", "0.005 BTC", "0.01 BTC"];

  if (showConfirmation && confirmationData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5" />
            <span>Deposit Confirmation</span>
          </CardTitle>
          <CardDescription>
            Please review your deposit details below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="font-medium">
                {confirmationData.depositAmount} BTC
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">USD Value:</span>
              <span className="font-medium">
                {formatUsdValue(
                  calculateUsdValue(confirmationData.depositAmount)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                STX Address:
              </span>
              <div className="flex items-center">
                <span className="font-medium truncate max-w-[150px]">
                  {confirmationData.stxAddress}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-1"
                  onClick={() =>
                    handleCopyToClipboard(
                      confirmationData.stxAddress,
                      "stxAddress"
                    )
                  }
                >
                  {copiedField === "stxAddress" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2 bg-muted p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Deposit Address:</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() =>
                  handleCopyToClipboard(
                    confirmationData.depositAddress,
                    "depositAddress"
                  )
                }
              >
                {copiedField === "depositAddress" ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy
              </Button>
            </div>
            <div className="text-xs break-all bg-background p-2 rounded">
              {confirmationData.depositAddress}
            </div>
          </div>

          <div className="space-y-2 bg-muted p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">OP_RETURN Data:</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() =>
                  handleCopyToClipboard(
                    confirmationData.opReturnHex,
                    "opReturnHex"
                  )
                }
              >
                {copiedField === "opReturnHex" ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy
              </Button>
            </div>
            <div className="text-xs break-all bg-background p-2 rounded">
              {confirmationData.opReturnHex}
            </div>
          </div>

          <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm">
            <p>
              Please send exactly {confirmationData.depositAmount} BTC to the
              deposit address above.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            className="w-full"
            onClick={() => {
              toast({
                title: "Transaction Initiated",
                description:
                  "Your deposit transaction has been initiated. Please check your wallet for confirmation.",
              });
            }}
          >
            Complete Transaction
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleBackToDeposit}
          >
            Back to Deposit Form
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bitcoin className="h-5 w-5" />
          <span>Bitcoin Deposit</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bitcoin className="h-4 w-4" />
              <span className="font-medium">Bitcoin</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatUsdValue(calculateUsdValue(amount))}
            </span>
          </div>

          <div className="relative">
            <Input
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00000000"
              className="text-right pr-16 h-14 text-xl"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              BTC
            </span>
          </div>

          <div className="flex gap-2 mt-3">
            {presetAmounts.map((presetAmount, index) => (
              <Button
                key={presetAmount}
                size="sm"
                variant={
                  selectedPreset === presetAmount ? "default" : "outline"
                }
                onClick={() => handlePresetClick(presetAmount)}
              >
                {presetLabels[index]}
              </Button>
            ))}
            <Button
              size="sm"
              variant={selectedPreset === "max" ? "default" : "outline"}
              onClick={handleMaxClick}
            >
              MAX
            </Button>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Estimated time
            </span>
            <span className="text-xs text-muted-foreground">
              1 Block ~ 10 min
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Service fee</span>
            <span className="text-xs text-muted-foreground">
              {amount && Number.parseFloat(amount) > 0 && btcUsdPrice
                ? `${formatUsdValue(
                    Number.parseFloat(calculateFee(amount)) * btcUsdPrice
                  )} ~ ${calculateFee(amount)} BTC`
                : "$0.00 ~ 0.00000000 BTC"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Pool liquidity
            </span>
            <span className="text-xs text-muted-foreground">
              $650,000 ~ 10.00000000 BTC
            </span>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-it-works" className="border-none">
            <AccordionTrigger className="py-0 justify-end">
              <div className="flex items-center text-xs text-muted-foreground">
                <span>How it works</span>
                <Info className="h-3 w-3 ml-1" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-xs text-muted-foreground">
                Your BTC deposit unlocks sBTC via Clarity's direct Bitcoin state
                reading. No intermediaries or multi-signature scheme needed.
                Trustless. Fast. Secure.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full h-14 text-lg"
          onClick={prepareTransaction}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Confirm Deposit"}
        </Button>
      </CardFooter>
    </Card>
  );
}
