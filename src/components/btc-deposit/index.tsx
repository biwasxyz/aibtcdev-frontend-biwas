"use client";

import { useState, useEffect } from "react";
import { TransactionPriority } from "@faktoryfun/styx-sdk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import DepositForm, { type ConfirmationData } from "./DepositForm";
import TransactionConfirmation from "./TransactionConfirmation";
import { getStacksAddress, getBitcoinAddress } from "@/lib/address";
import { useSessionStore } from "@/store/session";
import AuthButton from "@/components/home/auth-button";

// These would be replaced with actual hooks in a real implementation
const useFormattedBtcPrice = () => {
  return { price: 65000 };
};

const useSdkPoolStatus = () => {
  return {
    data: {
      estimatedAvailable: 500000000, // 5 BTC in satoshis
    },
    isLoading: false,
  };
};

const useSdkDepositHistory = (userAddress: string | null) => {
  return {
    data: [],
    isLoading: false,
  };
};

const useSdkAllDepositsHistory = () => {
  return {
    data: [],
    isLoading: false,
  };
};

// Placeholder components for history tabs
const MyHistory = ({ depositHistory, isLoading, btcUsdPrice }: any) => (
  <div className="p-4 text-center text-muted-foreground">
    <p>Your deposit history will appear here</p>
  </div>
);

const AllDeposits = ({ allDepositsHistory, isLoading, btcUsdPrice }: any) => (
  <div className="p-4 text-center text-muted-foreground">
    <p>All deposits history will appear here</p>
  </div>
);

export default function BitcoinDeposit() {
  // Get session state from Zustand store
  const { accessToken, userId, isLoading } = useSessionStore();

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

  // Data fetching hooks
  const { price: btcUsdPrice } = useFormattedBtcPrice();
  const { data: poolStatus } = useSdkPoolStatus();
  const { data: depositHistory, isLoading: isDepositHistoryLoading } =
    useSdkDepositHistory(userAddress);
  const { data: allDepositsHistory, isLoading: isAllDepositsHistoryLoading } =
    useSdkAllDepositsHistory();

  // Determine if we should show the auth prompt
  // If we have a userAddress, we're connected
  //   const isConnected = !!userAddress;

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
      </div>

      <Card className="bg-card border-border/30">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="my-history">My History</TabsTrigger>
            <TabsTrigger value="all-deposits">All Deposits</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="p-4">
            <DepositForm
              btcUsdPrice={btcUsdPrice || null}
              poolStatus={poolStatus}
              setConfirmationData={setConfirmationData}
              setShowConfirmation={setShowConfirmation}
            />
          </TabsContent>

          <TabsContent value="my-history" className="p-4">
            <MyHistory
              depositHistory={depositHistory}
              isLoading={isDepositHistoryLoading}
              btcUsdPrice={btcUsdPrice || 100000}
            />
          </TabsContent>

          <TabsContent value="all-deposits" className="p-4">
            <AllDeposits
              allDepositsHistory={allDepositsHistory}
              isLoading={isAllDepositsHistoryLoading}
              btcUsdPrice={btcUsdPrice || 100000}
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
