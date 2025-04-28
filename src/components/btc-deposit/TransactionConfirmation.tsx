"use client";

import { useState, useEffect } from "react";
import { hex } from "@scure/base";
import * as btc from "@scure/btc-signer";
import { styxSDK, TransactionPriority } from "@faktoryfun/styx-sdk";
import { request as xverseRequest } from "sats-connect";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useSessionStore } from "@/store/session";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ConfirmationData } from "./DepositForm";

// Add this to fix the window.LeatherProvider type error
declare global {
  interface Window {
    LeatherProvider: any;
  }
}

interface TransactionConfirmationProps {
  confirmationData: ConfirmationData;
  open: boolean;
  onClose: () => void;
  feePriority: TransactionPriority;
  setFeePriority: (priority: TransactionPriority) => void;
  userAddress: string;
  btcAddress: string;
  activeWalletProvider: "leather" | "xverse" | null;
}

interface XverseSignPsbtResponse {
  status: "success" | "error";
  result?: {
    psbt: string;
    txid: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

export default function TransactionConfirmation({
  confirmationData,
  open,
  onClose,
  feePriority,
  setFeePriority,
  userAddress,
  btcAddress,
  activeWalletProvider,
}: TransactionConfirmationProps) {
  const { toast } = useToast();
  const [btcTxStatus, setBtcTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [btcTxId, setBtcTxId] = useState<string>("");
  const [currentDepositId, setCurrentDepositId] = useState<string | null>(null);
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  // Get session state from Zustand store
  const { accessToken, userId, isLoading, initialize } = useSessionStore();

  // Initialize session on component mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const [feeEstimates, setFeeEstimates] = useState({
    low: { rate: 1, fee: 0, time: "30 min" },
    medium: { rate: 3, fee: 0, time: "~20 min" },
    high: { rate: 5, fee: 0, time: "~10 min" },
  });

  const isP2SHAddress = (address: string): boolean => {
    return address.startsWith("3");
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [field]: true });

      toast({
        title: "Copied",
        description: "The information has been copied to your clipboard",
      });

      setTimeout(() => {
        setCopied({ ...copied, [field]: false });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      });
    }
  };

  const executeBitcoinTransaction = async (): Promise<void> => {
    console.log(
      "Starting transaction with activeWalletProvider:",
      activeWalletProvider
    );

    // Check if user is authenticated
    if (!accessToken) {
      toast({
        title: "Authentication required",
        description: "Please sign in before proceeding with the transaction",
        variant: "destructive",
      });
      return;
    }

    // Check if wallet is connected
    if (!activeWalletProvider) {
      toast({
        title: "No wallet connected",
        description: "Please connect a wallet before proceeding",
        variant: "destructive",
      });
      return;
    }

    const feeRates = await styxSDK.getFeeEstimates();
    const selectedFeeRate = feeRates[feePriority];
    console.log(
      `Using ${feePriority} priority fee rate: ${selectedFeeRate} sat/vB`
    );

    if (!confirmationData) {
      toast({
        title: "Error",
        description: "Missing transaction data",
        variant: "destructive",
      });
      return;
    }

    // Begin Bitcoin transaction process
    setBtcTxStatus("pending");

    try {
      // Create deposit record
      console.log("Creating deposit with data:", {
        btcAmount: Number.parseFloat(confirmationData.depositAmount),
        stxReceiver: userAddress || "",
        btcSender: btcAddress || "",
      });

      // Create deposit record which will update pool status (reduce estimated available)
      const depositId = await styxSDK.createDeposit({
        btcAmount: Number.parseFloat(confirmationData.depositAmount),
        stxReceiver: userAddress || "",
        btcSender: btcAddress || "",
      });
      console.log("Create deposit depositId:", depositId);

      // Store deposit ID for later use
      setCurrentDepositId(depositId);

      try {
        if (
          activeWalletProvider === "leather" &&
          (typeof window === "undefined" || !window.LeatherProvider)
        ) {
          throw new Error("Leather wallet is not installed or not accessible");
        }

        console.log(
          "Window object has LeatherProvider:",
          !!window.LeatherProvider
        );
        console.log("Full window object keys:", Object.keys(window));

        if (!userAddress) {
          throw new Error("STX address is missing or invalid");
        }

        if (activeWalletProvider === "leather") {
          console.log("About to use LeatherProvider:", window.LeatherProvider);
        }

        // Use the BTC address from context
        if (!btcAddress) {
          throw new Error("Could not find a valid BTC address in wallet");
        }

        const senderBtcAddress = btcAddress;
        console.log("Using BTC address from context:", senderBtcAddress);

        // Get a transaction prepared for signing
        console.log("Getting prepared transaction from SDK...");
        const preparedTransaction = await styxSDK.prepareTransaction({
          amount: confirmationData.depositAmount,
          userAddress,
          btcAddress,
          feePriority,
          walletProvider: activeWalletProvider,
        });

        // Here, update fee estimates from the prepared transaction
        setFeeEstimates({
          low: {
            rate: preparedTransaction.feeRate,
            fee: preparedTransaction.fee,
            time: "30 min",
          },
          medium: {
            rate: preparedTransaction.feeRate,
            fee: preparedTransaction.fee,
            time: "~20 min",
          },
          high: {
            rate: preparedTransaction.feeRate,
            fee: preparedTransaction.fee,
            time: "~10 min",
          },
        });

        // Execute transaction with prepared data
        console.log("Creating transaction with SDK...");
        const transactionData = await styxSDK.executeTransaction({
          depositId,
          preparedData: {
            utxos: preparedTransaction.utxos,
            opReturnData: preparedTransaction.opReturnData,
            depositAddress: preparedTransaction.depositAddress,
            fee: preparedTransaction.fee,
            changeAmount: preparedTransaction.changeAmount,
            amountInSatoshis: preparedTransaction.amountInSatoshis,
            feeRate: preparedTransaction.feeRate,
            inputCount: preparedTransaction.inputCount,
            outputCount: preparedTransaction.outputCount,
            inscriptionCount: preparedTransaction.inscriptionCount,
          },
          walletProvider: activeWalletProvider,
          btcAddress: senderBtcAddress,
        });

        console.log("Transaction execution prepared:", transactionData);

        // Create a transaction object from the PSBT
        let tx = new btc.Transaction({
          allowUnknownOutputs: true,
          allowUnknownInputs: true,
          disableScriptCheck: false,
        });

        // Load the base transaction from PSBT
        tx = btc.Transaction.fromPSBT(hex.decode(transactionData.txPsbtHex));

        // Handle P2SH for Xverse which requires frontend handling
        const isP2sh = isP2SHAddress(senderBtcAddress);
        if (
          isP2sh &&
          activeWalletProvider === "xverse" &&
          transactionData.needsFrontendInputHandling
        ) {
          console.log("Adding P2SH inputs specifically for Xverse");

          // Only for P2SH + Xverse, do we need to add inputs - in all other cases the backend handled it
          for (const utxo of preparedTransaction.utxos) {
            try {
              // First, try to get the account (which might fail if we don't have permission)
              console.log("Trying to get wallet account...");
              let walletAccount = await (xverseRequest as any)(
                "wallet_getAccount",
                null
              );

              // If we get an access denied error, we need to request permissions
              if (
                walletAccount.status === "error" &&
                walletAccount.error.code === -32002
              ) {
                console.log("Access denied. Requesting permissions...");

                // Request permissions using wallet_requestPermissions as shown in the docs
                const permissionResponse = await (xverseRequest as any)(
                  "wallet_requestPermissions",
                  null
                );
                console.log("Permission response:", permissionResponse);

                // If the user granted permission, try again to get the account
                if (permissionResponse.status === "success") {
                  console.log(
                    "Permission granted. Trying to get wallet account again..."
                  );
                  walletAccount = await (xverseRequest as any)(
                    "wallet_getAccount",
                    null
                  );
                } else {
                  throw new Error("User declined to grant permissions");
                }
              }

              console.log("Wallet account response:", walletAccount);

              if (
                walletAccount.status === "success" &&
                walletAccount.result.addresses
              ) {
                // Find the payment address that matches our sender address
                const paymentAddress = (
                  walletAccount.result as any
                ).addresses.find(
                  (addr: any) =>
                    addr.address === senderBtcAddress &&
                    addr.purpose === "payment"
                );

                if (paymentAddress && paymentAddress.publicKey) {
                  console.log(
                    "Found matching public key for P2SH address:",
                    paymentAddress.publicKey
                  );

                  // Create P2SH-P2WPKH from public key as shown in documentation
                  const publicKeyBytes = hex.decode(paymentAddress.publicKey);
                  const p2wpkh = btc.p2wpkh(publicKeyBytes, btc.NETWORK);
                  const p2sh = btc.p2sh(p2wpkh, btc.NETWORK);

                  // Add input with redeemScript
                  tx.addInput({
                    txid: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                      script: p2sh.script,
                      amount: BigInt(utxo.value),
                    },
                    redeemScript: p2sh.redeemScript,
                  });
                } else {
                  throw new Error(
                    "Could not find payment address with public key"
                  );
                }
              } else {
                throw new Error("Failed to get wallet account info");
              }
            } catch (err) {
              console.error("Error getting wallet account info:", err);
              throw new Error(
                "P2SH address requires access to the public key. Please use a SegWit address (starting with 'bc1') or grant necessary permissions."
              );
            }
          }
        }

        // Extract transaction details from response
        const { transactionDetails } = transactionData;
        console.log("Transaction summary:", transactionDetails);

        // Generate PSBT and request signing
        const txPsbt = tx.toPSBT();
        const finalTxPsbtHex = hex.encode(txPsbt);
        const finalTxPsbtBase64 = Buffer.from(finalTxPsbtHex, "hex").toString(
          "base64"
        );

        let txid;

        console.log("Wallet-specific flow for:", activeWalletProvider);

        if (activeWalletProvider === "leather") {
          // Leather wallet flow
          const requestParams = {
            hex: finalTxPsbtHex,
            network: "mainnet",
            broadcast: false,
            allowedSighash: [btc.SigHash.ALL],
            allowUnknownOutputs: true,
          };

          if (!window.LeatherProvider) {
            throw new Error(
              "Leather wallet provider not found on window object"
            );
          }

          // Send the signing request to Leather
          const signResponse = await window.LeatherProvider.request(
            "signPsbt",
            requestParams
          );

          if (
            !signResponse ||
            !signResponse.result ||
            !signResponse.result.hex
          ) {
            throw new Error(
              "Leather wallet did not return a valid signed PSBT"
            );
          }

          // We get the hex of the signed PSBT back, finalize it
          const signedPsbtHex = signResponse.result.hex;
          const signedTx = btc.Transaction.fromPSBT(hex.decode(signedPsbtHex));
          signedTx.finalize();
          const finalTxHex = hex.encode(signedTx.extract());

          // Manually broadcast the transaction
          const broadcastResponse = await fetch(
            "https://mempool.space/api/tx",
            {
              method: "POST",
              headers: {
                "Content-Type": "text/plain",
              },
              body: finalTxHex,
            }
          );

          if (!broadcastResponse.ok) {
            const errorText = await broadcastResponse.text();
            throw new Error(`Failed to broadcast transaction: ${errorText}`);
          }

          txid = await broadcastResponse.text();
        } else if (activeWalletProvider === "xverse") {
          console.log("Executing Xverse transaction flow");
          console.log("xverseRequest function type:", typeof xverseRequest);
          // Xverse wallet flow
          try {
            console.log("Starting Xverse PSBT signing flow...");

            // Add all input addresses from our transaction
            const inputAddresses: Record<string, number[]> = {};
            inputAddresses[senderBtcAddress] = Array.from(
              { length: preparedTransaction.utxos.length },
              (_, i) => i
            );

            console.log("Input addresses for Xverse:", inputAddresses);
            console.log(
              "PSBT Base64 (first 100 chars):",
              finalTxPsbtBase64.substring(0, 100) + "..."
            );

            // Prepare request params
            const xverseParams = {
              psbt: finalTxPsbtBase64,
              signInputs: inputAddresses,
              broadcast: true, // Let Xverse handle broadcasting
              allowedSighash: [
                btc.SigHash.ALL,
                btc.SigHash.NONE,
                btc.SigHash.SINGLE,
                btc.SigHash.DEFAULT_ANYONECANPAY,
              ], // More complete set of sighash options
              options: {
                allowUnknownInputs: true,
                allowUnknownOutputs: true,
              },
            };

            // For P2SH addresses with Xverse, we need to add a special note in the logs
            if (isP2SHAddress(senderBtcAddress)) {
              console.log("Using P2SH-specific params for Xverse");
              console.log(
                "P2SH address detected, relying on Xverse's internal handling"
              );
            }

            console.log(
              "Calling Xverse request with params:",
              JSON.stringify(xverseParams, null, 2)
            );

            const response = (await xverseRequest(
              "signPsbt",
              xverseParams
            )) as XverseSignPsbtResponse;

            console.log(
              "Full Xverse response:",
              JSON.stringify(response, null, 2)
            );

            if (response.status !== "success") {
              console.error(
                "Xverse signing failed with status:",
                response.status
              );
              console.error("Xverse error details:", response.error);
              throw new Error(
                `Xverse signing failed: ${
                  response.error?.message || "Unknown error"
                }`
              );
            }

            // Fix the txid property access
            if (!response.result?.txid) {
              console.error("No txid in successful Xverse response:", response);
              throw new Error("No transaction ID returned from Xverse");
            }

            txid = response.result.txid;
            console.log("Successfully got txid from Xverse:", txid);
          } catch (err) {
            console.error("Detailed error with Xverse signing:", err);
            console.error("Error type:", typeof err);
            if (err instanceof Error) {
              console.error("Error name:", err.name);
              console.error("Error message:", err.message);
              console.error("Error stack:", err.stack);
            }
            throw err;
          }
        } else {
          throw new Error("No compatible wallet provider detected");
        }

        console.log("Transaction successfully broadcast with txid:", txid);

        // Update the deposit record with the transaction ID
        console.log(
          "Attempting to update deposit with ID:",
          depositId,
          "Type:",
          typeof depositId
        );

        try {
          console.log(
            "About to update deposit with ID:",
            depositId,
            "and txid:",
            txid
          );
          console.log("Update data:", {
            id: depositId,
            data: { btcTxId: txid, status: "broadcast" },
          });

          const updateResult = await styxSDK.updateDepositStatus({
            id: depositId,
            data: {
              btcTxId: txid,
              status: "broadcast",
            },
          });

          console.log(
            "Successfully updated deposit:",
            JSON.stringify(updateResult, null, 2)
          );
        } catch (error) {
          console.error("Error updating deposit with ID:", depositId);
          console.error("Update error details:", error);
          if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
          }
        }

        // Update state with success
        setBtcTxStatus("success");
        setBtcTxId(txid);

        // Show success message
        toast({
          title: "Deposit Initiated",
          description: `Your Bitcoin transaction has been sent successfully with txid: ${txid.substring(
            0,
            10
          )}...`,
        });

        // Close confirmation dialog
        onClose();
      } catch (err: any) {
        const error = err as Error;
        console.error("Error in Bitcoin transaction process:", error);
        setBtcTxStatus("error");

        // Update deposit as canceled if wallet interaction failed
        await styxSDK.updateDepositStatus({
          id: depositId,
          data: {
            status: "canceled",
          },
        });

        toast({
          title: "Error",
          description:
            error.message ||
            "Failed to process Bitcoin transaction. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      const error = err as Error;
      console.error("Error creating deposit record:", error);
      setBtcTxStatus("error");

      toast({
        title: "Error",
        description: "Failed to initiate deposit. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Render loading state while initializing session
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-slate-900 text-white border-slate-700">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="mt-4 text-sm text-slate-300">
              Loading your session...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-slate-900 text-white border-slate-700">
        <DialogHeader>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="mr-2 h-8 w-8 text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>Confirm Transaction Data</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Authentication status */}
          {!accessToken && (
            <Alert
              variant="destructive"
              className="bg-red-900/30 border-red-800 text-white"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Authentication required. Please sign in before proceeding with
                the transaction.
              </AlertDescription>
            </Alert>
          )}

          {/* Wallet connection status */}
          {!activeWalletProvider && (
            <Alert
              variant="destructive"
              className="bg-red-900/30 border-red-800 text-white"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No wallet connected. Please connect a wallet before proceeding
                with the transaction.
              </AlertDescription>
            </Alert>
          )}

          {/* Transaction details */}
          <div className="bg-slate-800 p-4 rounded-md">
            <div className="grid grid-cols-3 gap-x-2 gap-y-3">
              <div className="text-xs font-medium text-slate-300">Amount:</div>
              <div className="col-span-2 font-mono text-xs">
                {confirmationData.depositAmount} BTC
              </div>

              <div className="text-xs font-medium text-slate-300">
                STX Address:
              </div>
              <div className="col-span-2 font-mono text-xs break-all">
                {confirmationData.stxAddress}
              </div>

              <div className="text-xs font-medium text-slate-300 self-start">
                OP_RETURN:
              </div>
              <div className="col-span-2 relative">
                <div className="bg-slate-700 p-2 rounded-md max-h-[60px] overflow-y-auto overflow-x-hidden font-mono text-xs break-all whitespace-normal leading-tight">
                  {confirmationData.opReturnHex}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 bg-slate-600 hover:bg-slate-500"
                  onClick={() =>
                    copyToClipboard(confirmationData.opReturnHex, "opReturn")
                  }
                >
                  {copied.opReturn ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Wallet provider info */}
          <div className="bg-slate-800 p-4 rounded-md">
            <p className="text-sm mb-2 font-medium">Wallet Provider</p>
            <div className="flex items-center">
              <div className="px-3 py-1 bg-slate-700 rounded-md text-sm">
                {activeWalletProvider
                  ? activeWalletProvider.charAt(0).toUpperCase() +
                    activeWalletProvider.slice(1)
                  : "Not Connected"}
              </div>
            </div>
          </div>

          {/* Fee selection */}
          <div className="bg-slate-800 p-4 rounded-md">
            <p className="text-sm mb-3 font-medium">Select priority</p>

            <div className="grid grid-cols-3 gap-3">
              <Card
                className={cn(
                  "rounded-lg overflow-hidden border border-slate-700 hover:border-yellow-300 cursor-pointer",
                  feePriority === "low" ? "bg-yellow-900/40" : "bg-slate-800"
                )}
                onClick={() => setFeePriority(TransactionPriority.Low as any)}
              >
                <CardContent className="p-3 text-center">
                  <p className="text-white text-sm font-medium mb-1">Low</p>
                  <p className="text-slate-300 text-xs">
                    {feeEstimates.low.fee} sats
                  </p>
                  <p className="text-slate-400 text-xs">
                    ({feeEstimates.low.rate} sat/vB)
                  </p>
                  <p className="text-slate-400 text-xs">30 min</p>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  "rounded-lg overflow-hidden border border-slate-700 hover:border-yellow-300 cursor-pointer",
                  feePriority === "medium" ? "bg-yellow-900/40" : "bg-slate-800"
                )}
                onClick={() =>
                  setFeePriority(TransactionPriority.Medium as any)
                }
              >
                <CardContent className="p-3 text-center">
                  <p className="text-white text-sm font-medium mb-1">Medium</p>
                  <p className="text-slate-300 text-xs">
                    {feeEstimates.medium.fee} sats
                  </p>
                  <p className="text-slate-400 text-xs">
                    ({feeEstimates.medium.rate} sat/vB)
                  </p>
                  <p className="text-slate-400 text-xs">~20 min</p>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  "rounded-lg overflow-hidden border border-slate-700 hover:border-yellow-300 cursor-pointer",
                  feePriority === "high" ? "bg-yellow-900/40" : "bg-slate-800"
                )}
                onClick={() => setFeePriority(TransactionPriority.High as any)}
              >
                <CardContent className="p-3 text-center">
                  <p className="text-white text-sm font-medium mb-1">High</p>
                  <p className="text-slate-300 text-xs">
                    {feeEstimates.high.fee} sats
                  </p>
                  <p className="text-slate-400 text-xs">
                    ({feeEstimates.high.rate} sat/vB)
                  </p>
                  <p className="text-slate-400 text-xs">~10 min</p>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-slate-300 mt-4 text-left">
              Fees are estimated based on current network conditions.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-700 text-white hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={executeBitcoinTransaction}
            disabled={
              btcTxStatus === "pending" || !activeWalletProvider || !accessToken
            }
          >
            {btcTxStatus === "pending" ? "Processing..." : "Proceed to Wallet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
