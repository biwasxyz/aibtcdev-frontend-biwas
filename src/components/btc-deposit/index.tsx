"use client";

import { useState, useEffect } from "react";
import { TransactionPriority } from "@faktoryfun/styx-sdk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import DepositForm, { type ConfirmationData } from "./DepositForm";
import TransactionConfirmation from "./TransactionConfirmation";
import { getStacksAddress, getBitcoinAddress } from "@/lib/address";
import { useSessionStore } from "@/store/session";
import AuthButton from "@/components/home/auth-button";
import { useFormattedBtcPrice } from "@/hooks/deposit/useSdkBtcPrice";
import useSdkPoolStatus from "@/hooks/deposit/useSdkPoolStatus";
import useSdkDepositHistory from "@/hooks/deposit/useSdkDepositHistory";
import useSdkAllDepositsHistory from "@/hooks/deposit/useSdkAllDepositsHistory";

// Placeholder components for history tabs
const MyHistory = ({ depositHistory, isLoading, btcUsdPrice }: any) => (
  <div className="p-4 text-center">
    {isLoading ? (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    ) : depositHistory?.length > 0 ? (
      <p>Your deposit history will appear here</p>
    ) : (
      <p className="text-muted-foreground">No deposit history found</p>
    )}
  </div>
);

const AllDeposits = ({ allDepositsHistory, isLoading, btcUsdPrice }: any) => (
  <div className="p-4 text-center">
    {isLoading ? (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    ) : allDepositsHistory?.length > 0 ? (
      <p>All deposits history will appear here</p>
    ) : (
      <p className="text-muted-foreground">No deposits history found</p>
    )}
  </div>
);

export default function BitcoinDeposit() {
  // Get session state from Zustand store
  const { accessToken } = useSessionStore();

  // State management
  const [activeTab, setActiveTab] = useState("deposit");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] =
    useState<ConfirmationData | null>(null);
  const [feePriority, setFeePriority] = useState<TransactionPriority>(
    TransactionPriority.Medium
  );
  const [activeWalletProvider, setActiveWalletProvider] = useState<
    "leather" | "xverse" | null
  >("xverse");

  useEffect(() => {
    // When accessToken becomes available, set the wallet provider to Xverse
    if (accessToken) {
      setActiveWalletProvider("xverse");
    }
  }, [accessToken]);

  // Get addresses directly
  const userAddress = accessToken ? getStacksAddress() : null;
  const btcAddress = accessToken ? getBitcoinAddress() : null;

  // Data fetching hooks - now using the actual implementations
  const {
    price: btcUsdPrice,
    isLoading: isBtcPriceLoading,
    error: btcPriceError,
  } = useFormattedBtcPrice();
  const { data: poolStatus, isLoading: isPoolStatusLoading } =
    useSdkPoolStatus();
  const { data: depositHistory, isLoading: isDepositHistoryLoading } =
    useSdkDepositHistory(userAddress);
  const { data: allDepositsHistory, isLoading: isAllDepositsHistoryLoading } =
    useSdkAllDepositsHistory();

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

      <Card className="bg-card border-border/30">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="my-history">My History</TabsTrigger>
            <TabsTrigger value="all-deposits">All Deposits</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="p-4">
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
          </TabsContent>

          <TabsContent value="my-history" className="p-4">
            <MyHistory
              depositHistory={depositHistory}
              isLoading={isDepositHistoryLoading}
              btcUsdPrice={btcUsdPrice}
            />
          </TabsContent>

          <TabsContent value="all-deposits" className="p-4">
            <AllDeposits
              allDepositsHistory={allDepositsHistory}
              isLoading={isAllDepositsHistoryLoading}
              btcUsdPrice={btcUsdPrice}
            />
          </TabsContent>
        </Tabs>
      </Card>

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
