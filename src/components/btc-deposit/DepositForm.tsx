"use client";

import { useState, type ChangeEvent, useEffect } from "react";
import { getStacksAddress, getBitcoinAddress } from "@/lib/address";
import { styxSDK } from "@faktoryfun/styx-sdk";
import { MIN_DEPOSIT_SATS, MAX_DEPOSIT_SATS } from "@faktoryfun/styx-sdk";
import { useToast } from "@/hooks/use-toast";
import { Bitcoin, Loader2 } from "lucide-react";
import AuthButton from "@/components/home/auth-button";
import { useSessionStore } from "@/store/session";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DepositFormProps {
  btcUsdPrice: number | null;
  poolStatus: any;
  setConfirmationData: (data: ConfirmationData) => void;
  setShowConfirmation: (show: boolean) => void;
}

export interface ConfirmationData {
  depositAmount: string;
  depositAddress: string;
  stxAddress: string;
  opReturnHex: string;
}

export default function DepositForm({
  btcUsdPrice,
  poolStatus,
  setConfirmationData,
  setShowConfirmation,
}: DepositFormProps) {
  const [amount, setAmount] = useState<string>("0.0001");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const { toast } = useToast();

  // Get session state from Zustand store
  const { accessToken, userId, isLoading, initialize } = useSessionStore();

  // Initialize session on component mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const [btcBalance, setBtcBalance] = useState<number | null>(0.05);
  const [activeWalletProvider, setActiveWalletProvider] = useState<
    "leather" | "xverse" | null
  >(null);

  // Get addresses from the lib - only if we have a session
  const userAddress = accessToken ? getStacksAddress() : null;
  const btcAddress = accessToken ? getBitcoinAddress() : null;

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
    if (!btcAmount || !btcUsdPrice) return 0;
    const numAmount = Number.parseFloat(btcAmount);
    return isNaN(numAmount) ? 0 : numAmount * btcUsdPrice;
  };

  const calculateFee = (btcAmount: string): string => {
    if (!btcAmount || Number.parseFloat(btcAmount) <= 0) return "0.00000000";
    const numAmount = Number.parseFloat(btcAmount);
    if (isNaN(numAmount)) return "0.00003000";

    return numAmount <= 0.002 ? "0.00003000" : "0.00006000";
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setSelectedPreset(null);
    }
  };

  const handlePresetClick = (presetAmount: string): void => {
    setAmount(presetAmount);
    setSelectedPreset(presetAmount);
  };

  const handleMaxClick = async (): Promise<void> => {
    if (btcBalance !== null) {
      try {
        const feeRates = await styxSDK.getFeeEstimates();
        const selectedRate = feeRates.medium;
        const estimatedSize = 1 * 70 + 2 * 33 + 12;
        const networkFeeSats = estimatedSize * selectedRate;
        const networkFee = networkFeeSats / 100000000;
        const maxAmount = Math.max(0, btcBalance - networkFee);
        const formattedMaxAmount = maxAmount.toFixed(8);

        setAmount(formattedMaxAmount);
        setSelectedPreset("max");
      } catch (error) {
        console.error("Error calculating max amount:", error);
        const networkFee = 0.000006;
        const maxAmount = Math.max(0, btcBalance - networkFee);
        setAmount(maxAmount.toFixed(8));
        setSelectedPreset("max");
      }
    }
  };

  const handleDepositConfirm = async (): Promise<void> => {
    if (maintenanceMode) {
      toast({
        title: "Scheduled Maintenance",
        description:
          "We know you're eager to test this feature! We're working diligently to implement support for both legacy and segwit addresses ahead of schedule. Deposits will be back online in just a few hours. Thank you for your patience.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid BTC amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!accessToken || !userAddress) {
      toast({
        title: "Not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!btcAddress) {
        throw new Error("No Bitcoin address found in your wallet");
      }

      const amountInSats = Math.round(Number.parseFloat(amount) * 100000000);

      console.log(MIN_DEPOSIT_SATS, MAX_DEPOSIT_SATS);
      if (amountInSats < MIN_DEPOSIT_SATS) {
        toast({
          title: "Minimum deposit required",
          description: `Please deposit at least ${
            MIN_DEPOSIT_SATS / 100000000
          } BTC`,
          variant: "destructive",
        });
        return;
      }

      if (amountInSats > MAX_DEPOSIT_SATS) {
        toast({
          title: "Beta limitation",
          description: `During beta, the maximum deposit amount is ${
            MAX_DEPOSIT_SATS / 100000000
          } BTC. Thank you for your understanding.`,
          variant: "destructive",
        });
        return;
      }

      if (poolStatus && amountInSats > poolStatus.estimatedAvailable) {
        toast({
          title: "Insufficient liquidity",
          description: `The pool currently has ${
            poolStatus.estimatedAvailable / 100000000
          } BTC available. Please try a smaller amount.`,
          variant: "destructive",
        });
        return;
      }

      const amountInBTC = Number.parseFloat(amount);
      const networkFeeInBTC = 0.000006;
      const totalRequiredBTC = amountInBTC + networkFeeInBTC;

      if ((btcBalance || 0) < totalRequiredBTC) {
        const shortfallBTC = totalRequiredBTC - (btcBalance || 0);
        throw new Error(
          `Insufficient funds. You need ${shortfallBTC.toFixed(
            8
          )} BTC more to complete this transaction.`
        );
      }

      try {
        console.log("Preparing transaction with SDK...");

        const transactionData = await styxSDK.prepareTransaction({
          amount,
          userAddress,
          btcAddress,
          feePriority: "medium",
          walletProvider: activeWalletProvider,
        });

        console.log("Transaction prepared:", transactionData);

        setConfirmationData({
          depositAmount: amount,
          depositAddress: transactionData.depositAddress,
          stxAddress: userAddress,
          opReturnHex: transactionData.opReturnData,
        });

        setShowConfirmation(true);
      } catch (err: any) {
        console.error("Error preparing transaction:", err);

        if (isInscriptionError(err)) {
          handleInscriptionError(err);
        } else if (isUtxoCountError(err)) {
          handleUtxoCountError(err);
        } else if (isAddressTypeError(err)) {
          handleAddressTypeError(err, activeWalletProvider);
        } else {
          toast({
            title: "Error",
            description:
              err.message || "Failed to prepare transaction. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      console.error("Error preparing Bitcoin transaction:", err);

      toast({
        title: "Error",
        description:
          err.message ||
          "Failed to prepare Bitcoin transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper functions for error handling
  function isAddressTypeError(error: Error): boolean {
    return (
      error.message.includes("inputType: sh without redeemScript") ||
      error.message.includes("P2SH") ||
      error.message.includes("redeem script")
    );
  }

  function handleAddressTypeError(
    error: Error,
    walletProvider: "leather" | "xverse" | null
  ): void {
    if (walletProvider === "leather") {
      toast({
        title: "Unsupported Address Type",
        description:
          "Leather wallet does not support P2SH addresses (starting with '3'). Please use a SegWit address (starting with 'bc1') instead.",
        variant: "destructive",
      });
    } else if (walletProvider === "xverse") {
      toast({
        title: "P2SH Address Error",
        description:
          "There was an issue with the P2SH address. This might be due to wallet limitations. Try using a SegWit address (starting with 'bc1') instead.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "P2SH Address Not Supported",
        description:
          "Your wallet doesn't provide the necessary information for your P2SH address. Please try using a SegWit address (starting with bc1) instead.",
        variant: "destructive",
      });
    }
  }

  function isInscriptionError(error: Error): boolean {
    return error.message.includes("with inscriptions");
  }

  function handleInscriptionError(error: Error): void {
    toast({
      title: "Inscriptions Detected",
      description: error.message,
      variant: "destructive",
    });
  }

  function isUtxoCountError(error: Error): boolean {
    return error.message.includes("small UTXOs");
  }

  function handleUtxoCountError(error: Error): void {
    toast({
      title: "Too Many UTXOs",
      description: error.message,
      variant: "destructive",
    });
  }

  const presetAmounts: string[] = ["0.001", "0.005", "0.01"];
  const presetLabels: string[] = ["0.001 BTC", "0.005 BTC", "0.01 BTC"];

  // Set wallet provider when authenticated
  const handleWalletSelect = (walletType: "leather" | "xverse") => {
    setActiveWalletProvider(walletType);
  };

  // Render loading state while initializing session
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 md:space-y-6 w-full max-w-md mx-auto">
      {/* From: Bitcoin */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5" />
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
            className="text-right pr-16 pl-16 h-[60px] text-xl bg-secondary"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-md pointer-events-none">
            BTC
          </span>
        </div>

        {/* Preset amounts */}
        <div className="flex gap-2 mt-3">
          {presetAmounts.map((presetAmount, index) => (
            <Button
              key={presetAmount}
              size="sm"
              variant={selectedPreset === presetAmount ? "default" : "outline"}
              className={
                selectedPreset === presetAmount
                  ? "bg-orange-500 hover:bg-orange-600 text-black"
                  : ""
              }
              onClick={() => handlePresetClick(presetAmount)}
            >
              {presetLabels[index]}
            </Button>
          ))}
          <Button
            size="sm"
            variant={selectedPreset === "max" ? "default" : "outline"}
            className={
              selectedPreset === "max"
                ? "bg-orange-500 hover:bg-orange-600 text-black"
                : ""
            }
            onClick={handleMaxClick}
          >
            MAX
          </Button>
        </div>
      </div>

      {/* Fee Information Box */}
      <Card className="bg-secondary border-border/30">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Estimated time
            </span>
            <span className="text-xs text-muted-foreground">
              1 Block ~ 10 min
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">Service fee</span>
            <span className="text-xs text-muted-foreground">
              {amount && Number.parseFloat(amount) > 0 && btcUsdPrice
                ? formatUsdValue(
                    Number.parseFloat(calculateFee(amount)) * btcUsdPrice
                  )
                : "$0.00"}{" "}
              ~ {calculateFee(amount)} BTC
            </span>
          </div>

          {/* Add Pool Liquidity information */}
          {poolStatus && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                Pool liquidity
              </span>
              <span className="text-xs text-muted-foreground">
                {formatUsdValue(
                  (poolStatus.estimatedAvailable / 100000000) *
                    (btcUsdPrice || 0)
                )}{" "}
                ~ {(poolStatus.estimatedAvailable / 100000000).toFixed(8)} BTC
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accordion with Additional Info */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="how-it-works" className="border-none">
          <div className="flex justify-end">
            <AccordionTrigger className="py-0 text-xs text-muted-foreground">
              How it works
            </AccordionTrigger>
          </div>
          <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
            Your BTC deposit unlocks sBTC via Clarity's direct Bitcoin state
            reading. No intermediaries or multi-signature scheme needed.
            Trustless. Fast. Secure.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Action Button */}
      {!accessToken ? (
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground mb-2">
            Connect your wallet to continue
          </p>
          <div className="flex justify-center">
            <AuthButton redirectUrl="/deposit" />
          </div>
        </div>
      ) : (
        <Button
          size="lg"
          className="h-[60px] text-xl bg-primary w-full"
          onClick={handleDepositConfirm}
        >
          Confirm Deposit
        </Button>
      )}
    </div>
  );
}
