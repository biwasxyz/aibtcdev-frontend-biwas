"use client";

import { useState, useEffect, useCallback } from "react";
import { getStacksAddress } from "@/lib/address";
import { useWalletStore } from "@/store/wallet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import type { WalletBalance } from "@/store/wallet";

const AssetTracker = () => {
  const { balances, fetchSingleBalance } = useWalletStore();
  const [hasSbtc, setHasSbtc] = useState<boolean | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Function to find sBTC token in fungible tokens
  const findSbtcToken = (
    fungibleTokens: WalletBalance["fungible_tokens"] | undefined
  ) => {
    if (!fungibleTokens) return null;

    const sbtcTokenKey = Object.keys(fungibleTokens).find((key) =>
      key.endsWith("::sbtc-token")
    );

    return sbtcTokenKey ? true : false;
  };

  // Memoize fetchData to prevent unnecessary recreations
  const fetchData = useCallback(
    async (address: string) => {
      try {
        console.log("Fetching balance for:", address);
        await fetchSingleBalance(address);
      } catch (err) {
        console.error("Error fetching balance:", err);
        setIsLoaded(true);
      }
    },
    [fetchSingleBalance]
  );

  // Initialize and check for data
  useEffect(() => {
    console.log("AssetTracker component mounted");

    const address = getStacksAddress();
    if (address) {
      console.log("Address found:", address);
      setCurrentAddress(address);

      // Fetch fresh data if no valid cache
      console.log("Fetching fresh data");
      fetchData(address);
    } else {
      console.log("No address found");
      // Show something even if no address is found
      setIsLoaded(true);
    }
  }, [fetchData]); // fetchData is now memoized with useCallback

  // Update when balances change
  useEffect(() => {
    if (currentAddress && balances[currentAddress] && !isLoaded) {
      //   console.log("Balances updated:", balances[currentAddress]);
      const hasSbtcToken = findSbtcToken(
        balances[currentAddress]?.fungible_tokens
      );
      //   console.log("Has sBTC:", hasSbtcToken);
      setHasSbtc(!!hasSbtcToken);
      setIsLoaded(true);
    }
  }, [balances, currentAddress, isLoaded]);

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
            You don&apos;t have sBTC in your wallet. Visit{" "}
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
            <DialogDescription>Coming soon</DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center">
            <p className="text-lg font-medium">Feature Coming Soon</p>
            <p className="mt-2">
              The ability to deposit sBTC into your smart wallet will be
              available in a future update.
            </p>
            <Button onClick={() => setIsDepositModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AssetTracker;
