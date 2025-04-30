"use client";

import { useState } from "react";
import { TransactionPriority } from "@faktoryfun/styx-sdk";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DepositForm, { type ConfirmationData } from "./DepositForm";
import TransactionConfirmation from "./TransactionConfirmation";
import MyHistory from "./my-history";
import { getStacksAddress, getBitcoinAddress } from "@/lib/address";
import { useSessionStore } from "@/store/session";
import AuthButton from "@/components/home/auth-button";
import { useFormattedBtcPrice } from "@/hooks/deposit/useSdkBtcPrice";
import useSdkPoolStatus from "@/hooks/deposit/useSdkPoolStatus";
import useSdkDepositHistory from "@/hooks/deposit/useSdkDepositHistory";

export default function BitcoinDeposit() {
  // Get session state from Zustand store
  const { accessToken } = useSessionStore();

  // State management
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] =
    useState<ConfirmationData | null>(null);
  const [feePriority, setFeePriority] = useState<TransactionPriority>(
    TransactionPriority.Medium
  );
  const [activeWalletProvider, setActiveWalletProvider] = useState<
    "leather" | "xverse" | null
  >("xverse");
  const [activeTab, setActiveTab] = useState<string>("deposit");

  // Get addresses directly
  const userAddress = accessToken ? getStacksAddress() : null;
  const btcAddress = accessToken ? getBitcoinAddress() : null;

  // Data fetching hooks
  const {
    price: btcUsdPrice,
    isLoading: isBtcPriceLoading,
    error: btcPriceError,
  } = useFormattedBtcPrice();
  const { data: poolStatus, isLoading: isPoolStatusLoading } =
    useSdkPoolStatus();

  // Use the provided deposit history hook
  const {
    data: depositHistory,
    isLoading: isHistoryLoading,
    isRefetching: isHistoryRefetching,
  } = useSdkDepositHistory(userAddress);

  // Determine if we're still loading critical data
  const isDataLoading =
    isBtcPriceLoading || isPoolStatusLoading || btcUsdPrice === undefined;

  // Render authentication prompt if not connected
  if (!accessToken) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold">
            Deposit BTC in just 1 Bitcoin block
          </h2>
          <p className="text-sm text-muted-foreground">
            Fast, secure, and trustless
          </p>
        </div>

        <Card className="p-8 flex flex-col items-center justify-center space-y-6">
          <p className="text-center">
            Please connect your wallet to access the deposit feature
          </p>
          <AuthButton redirectUrl="/deposit" />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold">
          Deposit BTC in just 1 Bitcoin block
        </h2>
        <p className="text-sm text-muted-foreground">
          Fast, secure, and trustless
        </p>
        {btcUsdPrice && (
          <p className="text-xs text-muted-foreground mt-1">
            Current BTC price: ${btcUsdPrice.toLocaleString()}
          </p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="history">My History</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
          <Card className="bg-card border-border/30 p-4">
            {isDataLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading deposit data...
                </p>
              </div>
            ) : btcPriceError ? (
              <div className="p-4 text-center">
                <p className="text-red-500">
                  Error loading BTC price data. Please try again later.
                </p>
              </div>
            ) : (
              <DepositForm
                btcUsdPrice={btcUsdPrice ?? null}
                poolStatus={poolStatus}
                setConfirmationData={setConfirmationData}
                setShowConfirmation={setShowConfirmation}
              />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <MyHistory
            depositHistory={depositHistory}
            isLoading={isHistoryLoading}
            btcUsdPrice={btcUsdPrice}
            isRefetching={isHistoryRefetching}
          />
        </TabsContent>
      </Tabs>

      {showConfirmation && confirmationData && (
        <TransactionConfirmation
          confirmationData={confirmationData}
          open={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          feePriority={feePriority}
          setFeePriority={setFeePriority}
          userAddress={userAddress || ""}
          btcAddress={btcAddress || ""}
          activeWalletProvider={activeWalletProvider}
        />
      )}
    </div>
  );
}
