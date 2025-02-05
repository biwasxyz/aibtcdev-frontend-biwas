"use client";

import { useState, useEffect } from "react";
import { Bot, Copy, Check, Lock } from "lucide-react";
import { useAgents } from "@/hooks/use-agents";
import { useWalletStore, WalletBalance } from "@/store/wallet";
import { useSessionStore } from "@/store/session";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import Image from "next/image";
import type { Agent, Wallet } from "@/types/supabase";

interface AgentSelectorSheetProps {
  selectedAgentId: string | null;
  onSelect: (value: string | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredTokenSymbol?: string;
}

export function AgentSelectorSheet({
  selectedAgentId,
  onSelect,
  open,
  onOpenChange,
  requiredTokenSymbol,
}: AgentSelectorSheetProps) {
  const { agents, loading: agentsLoading } = useAgents();
  const {
    balances,
    agentWallets,
    isLoading: walletsLoading,
    fetchWallets,
  } = useWalletStore();
  const { userId } = useSessionStore();
  const { toast } = useToast();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter out archived agents
  const activeAgents = agents.filter((agent) => !agent.is_archived);

  useEffect(() => {
    if (userId) {
      fetchWallets(userId).catch((err) => {
        setError("Failed to fetch wallets. Please try again.");
        console.error(err);
      });
    }
  }, [userId, fetchWallets]);

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    }
  };

  const formatBalance = (balance: string) => {
    return (Number(balance) / 1_000_000).toFixed(6);
  };

  const getWalletAddress = (wallet: Wallet) => {
    return process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
      ? wallet.mainnet_address
      : wallet.testnet_address;
  };

  const handleSelect = (agentId: string | null) => {
    console.log("Agent selection attempt:", {
      agentId,
      requiredTokenSymbol,
    });
    onSelect(agentId);
    onOpenChange(false);
  };

  const isAgentEligible = (
    balance: WalletBalance,
    requiredTokenSymbol?: string
  ) => {
    if (!requiredTokenSymbol) return true;

    const hasRequiredToken = Object.entries(balance.fungible_tokens).some(
      ([tokenId, token]) => {
        const [, tokenSymbol] = tokenId.split("::");
        return tokenSymbol === requiredTokenSymbol && Number(token.balance) > 0;
      }
    );

    return hasRequiredToken;
  };

  if (error) {
    return (
      <div className="flex h-11 w-auto items-center justify-center rounded-full bg-destructive/10 text-destructive px-4">
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (agentsLoading || walletsLoading) {
    return (
      <div className="flex h-11 w-auto items-center justify-center rounded-full bg-background/50 backdrop-blur-sm px-4">
        <Bot className="h-4 w-4 animate-pulse text-foreground/50 mr-2" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px]">
        <SheetHeader>
          <SheetTitle>Select an Agent</SheetTitle>
          <SheetDescription>
            {requiredTokenSymbol
              ? `Choose an agent with ${requiredTokenSymbol} tokens`
              : "Choose an agent to participate"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {activeAgents.map((agent) => {
            const wallet = agentWallets.find((w) => w.agent_id === agent.id);
            const walletAddress = wallet ? getWalletAddress(wallet) : null;
            const balance = walletAddress ? balances[walletAddress] : null;
            const isEligible = balance
              ? isAgentEligible(balance, requiredTokenSymbol)
              : false;

            return (
              <div
                key={agent.id}
                className={`flex flex-col p-3 rounded-lg ${
                  isEligible
                    ? "cursor-pointer hover:bg-accent"
                    : "opacity-50 cursor-not-allowed"
                } ${selectedAgentId === agent.id ? "bg-accent/50" : ""}`}
                onClick={() => isEligible && handleSelect(agent.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AgentAvatar agent={agent} className="h-8 w-8" />
                    <div>
                      <span className="font-medium">{agent.name}</span>
                      {walletAddress && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <code>{truncateAddress(walletAddress)}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(walletAddress);
                            }}
                          >
                            {copiedAddress === walletAddress ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {!isEligible && (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {balance && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">STX</span>
                      <span className="text-foreground">
                        {formatBalance(balance.stx.balance)}
                      </span>
                    </div>

                    {Object.entries(balance.fungible_tokens).map(
                      ([tokenId, token]) => {
                        const [, tokenSymbol] = tokenId.split("::");
                        return (
                          <div
                            key={tokenId}
                            className={`flex justify-between text-sm ${
                              requiredTokenSymbol === tokenSymbol
                                ? "font-bold text-foreground"
                                : ""
                            }`}
                          >
                            <span className="text-muted-foreground">
                              {tokenSymbol}
                            </span>
                            <span className="text-foreground">
                              {formatBalance(token.balance)}
                            </span>
                          </div>
                        );
                      }
                    )}

                    {Object.entries(balance.non_fungible_tokens).map(
                      ([tokenId, token]) => {
                        const [, tokenSymbol] = tokenId.split("::");
                        return (
                          <div
                            key={tokenId}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {tokenSymbol || "NFT"}
                            </span>
                            <span className="text-foreground">
                              {token.count} items
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AgentAvatar({
  agent,
  className = "",
}: {
  agent?: Agent;
  className?: string;
}) {
  if (!agent?.image_url) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-background ${className}`}
      >
        <Bot className="h-5 w-5 text-foreground/50" />
      </div>
    );
  }

  return (
    <div className={`relative rounded-full overflow-hidden ${className}`}>
      <Image
        src={agent.image_url || "/placeholder.svg"}
        alt={agent.name}
        height={24}
        width={24}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
        <span className="text-lg font-bold text-white">
          {agent.name.charAt(0).toUpperCase()}
        </span>
      </div>
    </div>
  );
}
