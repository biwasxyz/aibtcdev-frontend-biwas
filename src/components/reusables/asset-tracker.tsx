"use client";

import { useState, useEffect } from "react";
import { getStacksAddress } from "@/lib/address";
import {
  useWalletStore,
  type WalletBalance,
  type TokenBalance,
} from "@/store/wallet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const AssetTracker = () => {
  const { balances, fetchSingleBalance, isLoading, error } = useWalletStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [localWalletBalance, setLocalWalletBalance] =
    useState<WalletBalance | null>(null);

  // Function to find sBTC token in fungible tokens
  const findSbtcToken = (
    fungibleTokens: Record<string, TokenBalance> | undefined
  ) => {
    if (!fungibleTokens) return null;

    const sbtcTokenKey = Object.keys(fungibleTokens).find((key) =>
      key.endsWith("::sbtc-token")
    );

    return sbtcTokenKey
      ? { key: sbtcTokenKey, token: fungibleTokens[sbtcTokenKey] }
      : null;
  };

  // Initialize current address
  useEffect(() => {
    const address = "ST3NZFPCS28QN0SK9BQ2KYJ1RKJME8MYC1AZECTWB";
    setCurrentAddress(address);
    console.log("Initial address:", address);
  }, []);

  // Update local wallet balance when balances or address changes
  useEffect(() => {
    if (currentAddress && balances[currentAddress]) {
      setLocalWalletBalance(balances[currentAddress]);
      console.log("Updated local wallet balance:", balances[currentAddress]);
    }
  }, [balances, currentAddress]);

  async function fetchAssets() {
    const address = getStacksAddress();

    if (!address) {
      console.error("No address available");
      return;
    }

    setCurrentAddress(address);
    setIsRefreshing(true);

    try {
      // Fetch the balance for this specific address
      const balance = await fetchSingleBalance(address);
      console.log("Fetched balance:", balance);

      // Manually update local state to ensure UI updates
      if (balance) {
        setLocalWalletBalance(balance);
      }

      // Check if sBTC exists in fungible tokens
      const sbtcToken = findSbtcToken(balance?.fungible_tokens);
      console.log("Has sBTC:", !!sbtcToken);

      if (sbtcToken) {
        console.log("sBTC token key:", sbtcToken.key);
        console.log("sBTC balance:", sbtcToken.token);
      } else {
        console.log("No sBTC found in wallet");
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    } finally {
      setIsRefreshing(false);
    }
  }

  // Check if the wallet has sBTC
  const sbtcToken = findSbtcToken(localWalletBalance?.fungible_tokens);
  const hasSbtc = !!sbtcToken;

  // Log wallet balance whenever it changes
  useEffect(() => {
    console.log("Current local wallet balance:", localWalletBalance);
    console.log("Has sBTC:", hasSbtc);

    if (sbtcToken) {
      console.log("sBTC token key:", sbtcToken.key);
      console.log("sBTC balance:", sbtcToken.token);
    }
  }, [localWalletBalance, hasSbtc, sbtcToken]);

  // Function to open the deposit modal
  const openDepositModal = () => {
    console.log("Opening deposit modal");
    setIsDepositModalOpen(true);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={fetchAssets}
          disabled={isLoading || isRefreshing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading || isRefreshing ? "Loading..." : "Fetch assets"}
        </button>

        {currentAddress && (
          <div className="text-sm text-gray-600">Address: {currentAddress}</div>
        )}
      </div>

      {error && <div className="text-red-500 mb-4">Error: {error}</div>}

      {/* sBTC Section */}
      {localWalletBalance && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-bold mb-2">sBTC Status</h2>

          {hasSbtc && sbtcToken ? (
            <div>
              <p className="text-green-600 font-medium mb-2">
                You have sBTC in your wallet! Deposit it in your smart wallet.
              </p>
              <button
                onClick={openDepositModal}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Deposit sBTC
              </button>
              <div className="mt-2 text-sm">
                <p className="font-medium">Token: {sbtcToken.key}</p>
                <p>Balance: {sbtcToken.token.balance}</p>
                <p>Total Sent: {sbtcToken.token.total_sent}</p>
                <p>Total Received: {sbtcToken.token.total_received}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-amber-600 font-medium mb-2">
                Looks like you do not have sBTC in your wallet.
              </p>
              <a
                href="https://bitflow.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
              >
                Swap for sBTC on Bitflow
              </a>
            </div>
          )}
        </div>
      )}

      {/* STX Balance Section */}
      {localWalletBalance && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Wallet Balance</h2>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">STX</h3>
            <p>Balance: {localWalletBalance.stx.balance}</p>
            <p>Total Sent: {localWalletBalance.stx.total_sent}</p>
            <p>Total Received: {localWalletBalance.stx.total_received}</p>
          </div>

          {Object.keys(localWalletBalance.fungible_tokens || {}).length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Fungible Tokens</h3>
              {Object.entries(localWalletBalance.fungible_tokens || {}).map(
                ([tokenId, token]) => (
                  <div key={tokenId} className="bg-gray-50 p-4 rounded-lg mb-2">
                    <p className="font-medium">{tokenId}</p>
                    <p>Balance: {token.balance}</p>
                    <p>Total Sent: {token.total_sent}</p>
                    <p>Total Received: {token.total_received}</p>
                  </div>
                )
              )}
            </div>
          )}

          {Object.keys(localWalletBalance.non_fungible_tokens || {}).length >
            0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Non-Fungible Tokens</h3>
              {Object.entries(localWalletBalance.non_fungible_tokens || {}).map(
                ([tokenId, token]) => (
                  <div key={tokenId} className="bg-gray-50 p-4 rounded-lg mb-2">
                    <p className="font-medium">{tokenId}</p>
                    <p>Count: {token.count}</p>
                    <p>Total Sent: {token.total_sent}</p>
                    <p>Total Received: {token.total_received}</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Deposit Modal */}
      <Dialog
        open={isDepositModalOpen}
        onOpenChange={(open) => {
          console.log("Dialog onOpenChange:", open);
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
              onClick={() => {
                console.log("Closing modal");
                setIsDepositModalOpen(false);
              }}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetTracker;
