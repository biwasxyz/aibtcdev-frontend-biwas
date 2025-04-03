"use client";

import { useState, useEffect } from "react";
import { getStacksAddress } from "@/lib/address";
import { useWalletStore } from "@/store/wallet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const AssetTracker = () => {
  const { balances, fetchSingleBalance } = useWalletStore();
  const [hasSbtc, setHasSbtc] = useState<boolean | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Function to find sBTC token in fungible tokens
  const findSbtcToken = (fungibleTokens: Record<string, any> | undefined) => {
    if (!fungibleTokens) return null;

    const sbtcTokenKey = Object.keys(fungibleTokens).find((key) =>
      key.endsWith("::sbtc-token")
    );

    return sbtcTokenKey ? true : false;
  };

  // Initialize and check for data
  useEffect(() => {
    console.log("AssetTracker component mounted");

    const address = getStacksAddress();
    if (address) {
      console.log("Address found:", address);
      setCurrentAddress(address);

      // Try to get cached data first
      const cachedData = localStorage.getItem(`wallet_has_sbtc_${address}`);
      const cachedTimestamp = localStorage.getItem(
        `wallet_cache_timestamp_${address}`
      );

      if (cachedData && cachedTimestamp) {
        const now = new Date().getTime();
        const timestamp = Number.parseInt(cachedTimestamp);

        // Cache valid for 30 minutes
        if (now - timestamp < 30 * 60 * 1000) {
          console.log("Using cached data:", cachedData);
          setHasSbtc(cachedData === "true");
          setIsLoaded(true);
          return;
        }
      }

      // Fetch fresh data if no valid cache
      console.log("Fetching fresh data");
      fetchData(address);
    } else {
      console.log("No address found");
      // Show something even if no address is found
      setIsLoaded(true);
    }
  }, []);

  // Update when balances change
  useEffect(() => {
    if (currentAddress && balances[currentAddress] && !isLoaded) {
      console.log("Balances updated:", balances[currentAddress]);
      const hasSbtcToken = findSbtcToken(
        balances[currentAddress]?.fungible_tokens
      );
      console.log("Has sBTC:", hasSbtcToken);
      setHasSbtc(!!hasSbtcToken);
      setIsLoaded(true);

      // Cache the result
      localStorage.setItem(
        `wallet_has_sbtc_${currentAddress}`,
        String(!!hasSbtcToken)
      );
      localStorage.setItem(
        `wallet_cache_timestamp_${currentAddress}`,
        String(new Date().getTime())
      );
    }
  }, [balances, currentAddress, isLoaded]);

  async function fetchData(address: string) {
    try {
      console.log("Fetching balance for:", address);
      await fetchSingleBalance(address);
    } catch (err) {
      console.error("Error fetching balance:", err);
      setIsLoaded(true);
    }
  }

  const openDepositModal = () => {
    console.log("Opening deposit modal");
    setIsDepositModalOpen(true);
  };

  // Always render something
  return (
    <>
      <div className="w-full bg-amber-50 border-b border-amber-200 py-3 px-4 shadow-sm">
        {!isLoaded && (
          <p className="text-center text-amber-800">
            Checking your sBTC status...
          </p>
        )}

        {isLoaded && hasSbtc === true && (
          <p
            className="text-center text-amber-800 font-medium cursor-pointer hover:underline"
            onClick={openDepositModal}
          >
            You have sBTC in your wallet! Click here to deposit it in your smart
            wallet.
          </p>
        )}

        {isLoaded && hasSbtc === false && (
          <p className="text-center text-amber-800">
            You don't have sBTC in your wallet. Visit{" "}
            <a href="https://bitflow.app" className="underline font-medium">
              Bitflow or velar
            </a>{" "}
            to deposite sBTC in your wallet.
          </p>
        )}

        {isLoaded && hasSbtc === null && currentAddress && (
          <p className="text-center text-amber-800">
            Unable to check your sBTC status. Visit{" "}
            <a href="https://bitflow.app" className="underline font-medium">
              Bitflow
            </a>{" "}
            for more information.
          </p>
        )}

        {isLoaded && !currentAddress && (
          <p className="text-center text-amber-800">
            No wallet connected. Connect your wallet to check for sBTC.
          </p>
        )}
      </div>

      {/* Deposit Modal */}
      <Dialog
        open={isDepositModalOpen}
        onOpenChange={(open) => {
          setIsDepositModalOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit sBTC</DialogTitle>
            <DialogDescription>
              Coming soon! This feature is currently under development.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center">
            <p className="text-lg font-medium">Feature Coming Soon</p>
            <p className="mt-2 text-gray-600">
              The ability to deposit sBTC into your smart wallet will be
              available in a future update.
            </p>
            <button
              onClick={() => setIsDepositModalOpen(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AssetTracker;
