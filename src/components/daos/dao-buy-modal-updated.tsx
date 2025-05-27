"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Info, Loader2, Wallet, XCircle } from "lucide-react";
import { TokenBuyInput } from "./dao-buy";
import { useSessionStore } from "@/store/session";
import { useWalletStore } from "@/store/wallet";
import { fetchDAOExtensions, fetchToken } from "@/queries/dao-queries";
import type { DAO, Token, Extension } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import type { WalletBalance } from "@/store/wallet";
import AuthButton from "../home/auth-button";
import {
  formatStxBalance,
  formatTokenBalance,
  satoshiToBTC,
} from "@/helpers/format-utils";
import { getWalletAddress } from "@/helpers/wallet-utils";

interface DAOChatModalProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  presetAmount?: string;
}

type BuyResult = {
  success: boolean;
  link?: string | null;
  message?: string | null;
};

export function DAOBuyModal({
  daoId,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  token,
  presetAmount = "",
}: DAOChatModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = setControlledOpen || setUncontrolledOpen;

  /* purchase state */
  const [currentAmount, setCurrentAmount] = useState(presetAmount);
  const [result, setResult] = useState<BuyResult | null>(null);

  const { accessToken } = useSessionStore();
  const { balances, userWallet } = useWalletStore();

  const { data: tokenData, isLoading: isTokenLoading } = useQuery({
    queryKey: ["token", daoId],
    queryFn: () => fetchToken(daoId),
    staleTime: 600_000,
    enabled: open && !token,
  });

  const tokenName = tokenData?.symbol || token?.symbol || "DAO";

  useEffect(() => {
    if (presetAmount) setCurrentAmount(presetAmount);
  }, [presetAmount]);

  const { data: daoExtensions, isLoading: isExtensionsLoading } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 600_000,
    enabled: open,
  });

  /* ---------- helpers ---------- */
  const agentWalletData = (() => {
    if (!userWallet) return null;
    const address = getWalletAddress(userWallet);
    if (!address) return null;
    return {
      address,
      walletBalance: balances[address] as WalletBalance | undefined,
    };
  })();

  const btcValue = satoshiToBTC(currentAmount);

  // const tokenDexExtension = daoExtensions?.find(
  //   (ext: Extension) => ext.type === "TOKEN_DEX"
  // );

  const tokenDexExtension = daoExtensions?.find(
    (ext: Extension) => ext.type === "TOKEN" && ext.subtype === "DEX"
  );

  /* reset when modal closes */
  useEffect(() => {
    if (!open) setResult(null);
  }, [open]);

  /* ---------- UI sections ---------- */
  const SuccessPanel = ({ link }: { link: string | null }) => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h3 className="text-2xl font-bold mb-2">Transaction Successful!</h3>

      {link ? (
        <>
          <p className="text-muted-foreground mb-4">
            Your {tokenName} purchase has been broadcasted.
          </p>

          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 underline break-all text-primary"
          >
            {link}
          </a>
        </>
      ) : (
        <p className="text-muted-foreground mb-6">
          Transaction broadcasted, but no explorer link was returned.
        </p>
      )}

      <Button
        onClick={() => {
          setResult(null);
          setOpen(false);
        }}
        className="w-full max-w-xs"
      >
        Close
      </Button>
    </div>
  );

  const ErrorPanel = ({ message }: { message: string | null }) => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <XCircle className="h-10 w-10 text-red-600" />
      </div>

      <h3 className="text-2xl font-bold mb-2 text-red-600">
        Transaction Failed
      </h3>

      <p className="text-muted-foreground mb-6 max-w-md break-words">
        {message || "An unknown error occurred."}
      </p>

      <div className="flex gap-3 w-full max-w-xs">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setResult(null)}
        >
          Try again
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            setResult(null);
            setOpen(false);
          }}
        >
          Close
        </Button>
      </div>
    </div>
  );

  /* ---------- main renderer ---------- */
  const renderBody = () => {
    if (result?.success) return <SuccessPanel link={result.link ?? null} />;
    if (result && !result.success)
      return <ErrorPanel message={result.message ?? null} />;

    if (!accessToken)
      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <p className="text-lg mb-6">
              Please connect your wallet to buy tokens
            </p>
            <AuthButton />
          </div>
        </div>
      );

    if (isExtensionsLoading || isTokenLoading)
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-10 w-10 animate-spin" />
          <span className="ml-3 text-lg">Loading…</span>
        </div>
      );

    return (
      <div className="flex flex-col h-full">
        {/* header */}
        <div className="flex-shrink-0 h-16 flex items-center justify-between px-6 shadow-md bg-background z-10">
          <h2 className="text-lg font-medium">Buy {tokenName} Tokens</h2>
        </div>

        {/* body */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-muted p-4 rounded-lg flex items-start mb-6">
            <Info className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0 text-primary" />
            <p>
              You will spend <strong>{btcValue} BTC</strong> to receive{" "}
              <strong>{tokenName}</strong>.
            </p>
          </div>

          {agentWalletData && agentWalletData.walletBalance && (
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-4 flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Available Balance
              </h3>

              <div className="space-y-3">
                {agentWalletData.walletBalance.stx && (
                  <div className="flex justify-between items-center border-b pb-3">
                    <span>STX Balance</span>
                    <span className="font-medium">
                      {formatStxBalance(
                        agentWalletData.walletBalance.stx.balance
                      )}{" "}
                      STX
                    </span>
                  </div>
                )}

                {agentWalletData.walletBalance.fungible_tokens &&
                  Object.entries(
                    agentWalletData.walletBalance.fungible_tokens
                  ).map(([tokenId, token], idx, arr) => (
                    <div
                      key={tokenId}
                      className={`flex justify-between items-center ${
                        idx !== arr.length - 1 ? "border-b pb-3" : ""
                      }`}
                    >
                      <span>{tokenId.split("::")[1] || "Token"}</span>
                      <span className="font-medium">
                        {formatTokenBalance(token.balance)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="sticky bottom-0 w-full pb-safe shadow-lg bg-background border-t">
          {tokenDexExtension ? (
            <TokenBuyInput
              tokenName={tokenName}
              contractPrincipal={tokenDexExtension.contract_principal}
              initialAmount={currentAmount}
              onAmountChange={setCurrentAmount}
              onResult={setResult}
            />
          ) : (
            <div className="p-6 text-center text-lg text-muted-foreground">
              Unavailable to buy tokens
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] h-[650px] p-0 rounded-lg">
        <DialogTitle className="sr-only">Buy {tokenName} Tokens</DialogTitle>
        <DialogDescription className="sr-only">
          Purchase {tokenName} tokens with sBTC
        </DialogDescription>
        <div className="h-full overflow-hidden">{renderBody()}</div>
      </DialogContent>
    </Dialog>
  );
}
