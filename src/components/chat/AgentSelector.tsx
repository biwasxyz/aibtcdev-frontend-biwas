"use client";

import type * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { Bot, Copy, Check, ExternalLink, Plus } from "lucide-react";
import { useWalletStore } from "@/store/wallet";
import { useSessionStore } from "@/store/session";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { Agent } from "@/types/supabase";
import { getStacksAddress } from "@/lib/address";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { truncateAddress } from "@/helpers/format-utils";
import { useClipboard } from "@/helpers/clipboard-utils";
import { getWalletAddress } from "@/helpers/wallet-utils";
import { formatStxBalance } from "@/helpers/format-utils";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents, fetchAgentById } from "@/queries/agent-queries";
import { fetchWallets } from "@/queries/wallet-queries";

// Dynamically import Stacks components
const StacksComponents = dynamic(() => import("../wallet/StacksComponent"), {
  ssr: false,
});

interface AgentWalletSelectorProps {
  selectedAgentId: string | null;
  onSelect: (value: string | null) => void;
  disabled?: boolean;
}

export function AgentWalletSelector({
  selectedAgentId,
  onSelect,
}: AgentWalletSelectorProps) {
  const [open, setOpen] = useState(false);
  const [stxAmounts, setStxAmounts] = useState<{ [key: string]: string }>({});
  const {
    balances,
    agentWallets,
    isLoading: walletsLoading,
    fetchWallets: fetchWalletsStore,
  } = useWalletStore();
  const { userId } = useSessionStore();
  const { toast } = useToast();
  const { copiedText, copyToClipboard } = useClipboard();

  // Get user address once
  const userAddress = useMemo(() => getStacksAddress(), []);

  // Fetch agents using React Query
  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch selected agent details
  const { data: selectedAgent } = useQuery({
    queryKey: ["agent", selectedAgentId],
    queryFn: () => fetchAgentById(selectedAgentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!selectedAgentId,
  });

  // Fetch wallets using React Query
  const {
    isLoading: isLoadingWallets,
    isError: isWalletsError,
    data: walletsData,
  } = useQuery({
    queryKey: ["wallets", userId],
    queryFn: () => fetchWallets(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle wallet data loading
  useEffect(() => {
    if (walletsData && userId) {
      // Update the wallet store with the fetched data
      fetchWalletsStore(userId);

      // Initialize stxAmounts with empty strings for all wallet addresses
      const initialStxAmounts: { [key: string]: string } = {};
      const userWallet = walletsData.find((wallet) => wallet.agent_id === null);
      const agentWallets = walletsData.filter(
        (wallet) => wallet.agent_id !== null
      );

      if (userWallet) {
        initialStxAmounts[getWalletAddress(userWallet)] = "";
      }

      agentWallets.forEach((wallet) => {
        initialStxAmounts[getWalletAddress(wallet)] = "";
      });

      setStxAmounts(initialStxAmounts);
    }
  }, [walletsData, userId, fetchWalletsStore]);

  // Handle stored agent ID and default agent selection
  useEffect(() => {
    if (userAddress) {
      // Load stored agent ID from localStorage
      const storedAgentId = localStorage.getItem(
        `${userAddress}_selectedAgentId`
      );
      if (storedAgentId && !selectedAgentId) {
        onSelect(storedAgentId);
      } else if (!selectedAgentId && agents.length > 0) {
        // Find the DAO Manager agent
        const daoManagerAgent = agents.find(
          (agent) => agent.name === "DAO Manager"
        );

        // If found and no agent is currently selected, select it by default
        if (daoManagerAgent) {
          onSelect(daoManagerAgent.id);
          localStorage.setItem(
            `${userAddress}_selectedAgentId`,
            daoManagerAgent.id
          );
        }
      }
    }
  }, [userAddress, agents, selectedAgentId, onSelect]);

  const handleAmountChange = (address: string, value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setStxAmounts((prev) => ({ ...prev, [address]: value }));
    }
  };

  const handleSelect = (agentId: string | null) => {
    onSelect(agentId);
    if (userAddress) {
      if (agentId) {
        localStorage.setItem(`${userAddress}_selectedAgentId`, agentId);
      } else {
        localStorage.removeItem(`${userAddress}_selectedAgentId`);
      }
    }
    setOpen(false);
  };

  const handleStacksAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  if (isWalletsError) {
    return (
      <div className="flex h-11 w-auto items-center justify-center rounded-full bg-destructive/10 text-destructive px-4">
        <span className="text-sm">
          Failed to fetch wallets. Please try again.
        </span>
      </div>
    );
  }

  if (agentsLoading || walletsLoading || isLoadingWallets) {
    return (
      <div className="flex h-11 w-auto items-center justify-center rounded-full bg-background/50 backdrop-blur-sm px-4">
        <Bot className="h-4 w-4 animate-pulse text-foreground/50 mr-2" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="max-w-[200px] z-100">
          {selectedAgent ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center overflow-hidden">
                <AgentAvatar agent={selectedAgent} className="h-3 w-3 mr-2" />
                <span className="text-sm font-medium truncate">
                  {selectedAgent.name}
                </span>
              </div>
              {/* <span className="text-xs text-muted-foreground mt-0.5">
                click to manage
              </span> */}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                <Bot className="h-5 w-5 text-foreground/50 mr-2" />
                <span className="text-sm font-medium">DAO Manager</span>
              </div>
              {/* <span className="text-xs text-muted-foreground mt-0.5">
                click to manage
              </span> */}
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Select Agent</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(100vh-200px)] max-h-[500px]">
          <div className="p-4">
            {/* Assistant Agent Option 
            <div
              className="flex flex-col items-stretch p-3 cursor-pointer hover:bg-zinc-800 rounded-md"
              onClick={() => handleSelect(null)}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <div className="flex items-center justify-center rounded-full bg-background h-8 w-8">
                    <Bot className="h-5 w-5 text-foreground/50" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-[150px]">
                      Assistant Agent
                    </span>
                    {userWallet && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <code className="break-all">
                          {truncateAddress(getWalletAddress(userWallet))}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(getWalletAddress(userWallet));
                          }}
                        >
                          {copiedAddress === getWalletAddress(userWallet) ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {userWallet &&
                  balances[getWalletAddress(userWallet)]?.stx?.balance && (
                    <span className="text-sm text-muted-foreground">
                      {formatBalance(
                        balances[getWalletAddress(userWallet)].stx.balance
                      )}{" "}
                      STX
                    </span>
                  )}
              </div>

              {userWallet && (
                <div
                  className="mt-2 flex items-center gap-2 flex-wrap"
                  onClick={handleStacksAction}
                >
                  <div className="flex-1 min-w-[200px]">
                    <StacksComponents
                      address={getWalletAddress(userWallet)}
                      amount={stxAmounts[getWalletAddress(userWallet)] || ""}
                      onAmountChange={(value) =>
                        handleAmountChange(getWalletAddress(userWallet), value)
                      }
                      onToast={(title, description, variant) =>
                        toast({ title, description, variant })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
            */}

            <Separator className="my-4" />

            {/* Create New Agent Button */}
            {agents.length === 0 && (
              <div className="p-3">
                <Link href="/agents/new" className="block">
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => setOpen(false)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Agent
                  </Button>
                </Link>
              </div>
            )}

            {/* Agents Section */}
            {agents.length > 0 && (
              <div>
                {agents.map((agent) => {
                  const wallet = agentWallets.find(
                    (w) => w.agent_id === agent.id
                  );
                  const walletAddress = getWalletAddress(wallet);
                  const balance = walletAddress
                    ? balances[walletAddress]?.stx?.balance
                    : null;

                  return (
                    <div
                      key={agent.id}
                      className="flex flex-col items-stretch p-3 cursor-pointer hover:bg-zinc-800 rounded-md mb-2"
                      onClick={() => handleSelect(agent.id)}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <AgentAvatar agent={agent} className="h-8 w-8" />
                          <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[150px]">
                              {agent.name}
                            </span>
                            {walletAddress && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <code className="break-all">
                                  {truncateAddress(walletAddress)}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0 flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(walletAddress);
                                  }}
                                >
                                  {copiedText === walletAddress ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        {balance && (
                          <span className="text-sm text-muted-foreground">
                            {formatStxBalance(balance)} STX
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {walletAddress && (
                          <div
                            className="flex-1 min-w-[200px]"
                            onClick={handleStacksAction}
                          >
                            <StacksComponents
                              address={walletAddress}
                              amount={stxAmounts[walletAddress] || ""}
                              onAmountChange={(value) =>
                                handleAmountChange(walletAddress, value)
                              }
                              onToast={(title, description, variant) =>
                                toast({ title, description, variant })
                              }
                            />
                          </div>
                        )}
                        <Link
                          href={`/profile`}
                          className="inline-flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            className="h-8 px-3 flex items-center gap-2"
                          >
                            <span className="text-sm">Manage</span>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
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

export default AgentWalletSelector;
