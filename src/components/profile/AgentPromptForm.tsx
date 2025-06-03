"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Trash2, Check, X, Pencil, Settings } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WalletInfoCard } from "@/components/profile/AgentWalletInfo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { fetchDAOs } from "@/queries/dao-queries";
import { fetchAgents } from "@/queries/agent-queries";
import {
  fetchAgentPrompts,
  createAgentPrompt,
  updateAgentPrompt,
  deleteAgentPrompt,
} from "@/queries/agent-prompt-queries";
import { useWalletStore } from "@/store/wallet";
import { useSessionStore } from "@/store/session";

export interface AgentPrompt {
  id: string;
  dao_id: string;
  agent_id: string;
  profile_id: string;
  prompt_text: string;
  is_active: boolean;
  model: string;
  temperature: number;
  created_at: string;
  updated_at: string;
}

export function AgentPromptForm() {
  const queryClient = useQueryClient();
  const { agentWallets, balances, fetchWallets } = useWalletStore();
  const { userId } = useSessionStore();
  const { toast } = useToast();

  // Fetch wallet information when userId is available
  useEffect(() => {
    if (userId) {
      fetchWallets(userId).catch((err) => {
        console.error("Failed to fetch wallets:", err);
        toast({
          title: "Error",
          description: "Failed to fetch wallet information",
          variant: "destructive",
        });
      });
    }
  }, [userId, fetchWallets, toast]);

  // Fetch all prompts
  const { data: prompts = [], isLoading: isLoadingPrompts } = useQuery({
    queryKey: ["prompts"],
    queryFn: fetchAgentPrompts,
  });

  // Fetch DAOs
  const { data: daos = [], isLoading: isLoadingDaos } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
  });

  // Fetch the DAO Manager agent
  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  // Store the DAO Manager agent ID
  const [daoManagerAgentId, setDaoManagerAgentId] = useState<string>("");

  // Set the DAO Manager agent ID once it's loaded
  useEffect(() => {
    if (agents.length > 0) {
      setDaoManagerAgentId(agents[0]?.id || "");
    }
  }, [agents]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<AgentPrompt, "id" | "created_at" | "updated_at">) =>
      createAgentPrompt(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prompt created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setEditingDaoId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create prompt: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<AgentPrompt, "id" | "created_at" | "updated_at">>;
    }) => updateAgentPrompt(id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prompt updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setEditingDaoId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update prompt: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAgentPrompt(id),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prompt deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete prompt: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Inline editing state
  const [editingDaoId, setEditingDaoId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({
    id: "",
    prompt_text: "",
    model: "gpt-4o",
    temperature: 0.1,
  });

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle start editing
  const handleStartEditing = (daoId: string) => {
    const existingPrompt = prompts.find((p) => p.dao_id === daoId);

    if (existingPrompt) {
      // Editing existing prompt
      setEditingData({
        id: existingPrompt.id,
        prompt_text: existingPrompt.prompt_text,
        model: existingPrompt.model || "gpt-4o",
        temperature: existingPrompt.temperature || 0.1,
      });
    } else {
      // Creating new prompt
      setEditingData({
        id: "",
        prompt_text: "",
        model: "gpt-4o",
        temperature: 0.1,
      });
    }

    setEditingDaoId(daoId);
    setErrors({});
  };

  // Handle cancel editing
  const handleCancelEditing = () => {
    setEditingDaoId(null);
    setErrors({});
  };

  // Handle input changes for inline editing
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditingData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!editingData.prompt_text.trim()) {
      newErrors.prompt_text = "Prompt text is required";
    }

    if (!daoManagerAgentId) {
      newErrors.agent_id = "DAO Manager agent not found";
    }

    // Validate temperature
    const temp = Number.parseFloat(editingData.temperature.toString());
    if (isNaN(temp) || temp < 0 || temp > 1) {
      newErrors.temperature = "Temperature must be between 0 and 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save prompt
  const handleSavePrompt = (daoId: string) => {
    if (!validateForm()) {
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "User ID is required",
        variant: "destructive",
      });
      return;
    }

    const promptData = {
      prompt_text: editingData.prompt_text,
      model: editingData.model,
      temperature: editingData.temperature,
      dao_id: daoId,
      agent_id: daoManagerAgentId,
      profile_id: userId,
      is_active: true,
    };

    if (editingData.id) {
      // Update existing prompt
      updateMutation.mutate({
        id: editingData.id,
        data: promptData,
      });
    } else {
      // Create new prompt
      createMutation.mutate(promptData);
    }
  };

  // Handle deleting a prompt
  const handleDelete = (promptId: string) => {
    if (confirm("Are you sure you want to delete this prompt?")) {
      deleteMutation.mutate(promptId);
    }
  };

  const isLoading =
    isLoadingDaos ||
    isLoadingAgents ||
    isLoadingPrompts ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  // Get DAO name by ID
  const getDaoName = (daoId: string) => {
    const dao = daos.find((d) => d.id === daoId);
    return dao ? dao.name : "";
  };

  // Get wallet information for an agent
  const getAgentWalletInfo = (agentId: string) => {
    if (!agentId) return { walletAddress: null, walletBalance: null };

    const agentWallet = agentWallets.find(
      (wallet) => wallet.agent_id === agentId,
    );

    const network = process.env.NEXT_PUBLIC_STACKS_NETWORK;
    const walletAddress =
      network === "mainnet"
        ? agentWallet?.mainnet_address
        : agentWallet?.testnet_address;

    const walletBalance = walletAddress ? balances[walletAddress] : null;

    return { walletAddress, walletBalance };
  };

  // Get DAO Manager wallet info
  const {
    walletAddress: daoManagerWalletAddress,
    walletBalance: daoManagerWalletBalance,
  } = getAgentWalletInfo(daoManagerAgentId);

  // Get all DAOs
  const uniqueDaoIds = daos.map((dao) => dao.id);

  return (
    <div className="w-full space-y-8">
      {/* Wallet Info Section */}
      {daoManagerAgentId && (
        <WalletInfoCard
          walletAddress={daoManagerWalletAddress}
          walletBalance={daoManagerWalletBalance}
        />
      )}

      {/* Agent Prompts Section */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">AI Agent Configuration</h3>
          <p className="text-muted-foreground">
            Configure how your AI agent responds to DAO proposals across different organizations
          </p>
        </div>

        <div className="bg-muted/20 rounded-2xl border border-border/30 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 bg-muted/30">
                  <TableHead className="text-foreground font-semibold px-6 py-4">DAO</TableHead>
                  <TableHead className="text-foreground font-semibold px-6 py-4">Status</TableHead>
                  <TableHead className="text-foreground font-semibold px-6 py-4">Model</TableHead>
                  <TableHead className="text-foreground font-semibold px-6 py-4">Temperature</TableHead>
                  <TableHead className="text-foreground font-semibold px-6 py-4">Prompt</TableHead>
                  <TableHead className="text-right text-foreground font-semibold px-6 py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && uniqueDaoIds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center space-y-4">
                        <Loader />
                        <p className="text-muted-foreground">Loading configurations...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : uniqueDaoIds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                          <Settings className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-foreground font-medium">No DAOs Available</p>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Available DAOs will appear here for AI agent configuration
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  uniqueDaoIds.map((daoId) => {
                    const prompt = prompts.find((p) => p.dao_id === daoId);
                    const daoName = getDaoName(daoId);
                    const isEditing = editingDaoId === daoId;

                    return (
                      <TableRow key={daoId} className="border-border/30 hover:bg-muted/20 transition-colors duration-300">
                        <TableCell className="font-semibold text-foreground px-6 py-4">
                          {daoName}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {prompt?.is_active ? (
                            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/50 px-3 py-1.5 font-medium">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-muted/50 text-muted-foreground border-muted/50 px-3 py-1.5 font-medium">
                              Disabled
                            </Badge>
                          )}
                        </TableCell>

                        {/* Model Selection */}
                        <TableCell className="px-6 py-4">
                          {isEditing ? (
                            <Select
                              value={editingData.model}
                              onValueChange={(value) =>
                                setEditingData({ ...editingData, model: value })
                              }
                            >
                              <SelectTrigger className="h-10 w-full bg-card/50 border-border/50 text-foreground rounded-xl">
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent className="bg-card/95 backdrop-blur-sm border-border/50 rounded-xl">
                                <SelectItem value="gpt-4o" className="text-foreground hover:bg-muted/50 rounded-lg">
                                  GPT-4o
                                </SelectItem>
                                <SelectItem value="gpt-4o-mini" className="text-foreground hover:bg-muted/50 rounded-lg">
                                  GPT-4o Mini
                                </SelectItem>
                                <SelectItem value="gpt-4.1-nano" className="text-foreground hover:bg-muted/50 rounded-lg">
                                  GPT-4.1 Nano
                                </SelectItem>
                                <SelectItem value="gpt-4.1-mini" className="text-foreground hover:bg-muted/50 rounded-lg">
                                  GPT-4.1 Mini
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground font-medium">
                              {prompt?.model || "gpt-4o"}
                            </span>
                          )}
                        </TableCell>

                        {/* Temperature */}
                        <TableCell className="px-6 py-4">
                          {isEditing ? (
                            <div>
                              <Input
                                name="temperature"
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={editingData.temperature}
                                onChange={handleInputChange}
                                className="h-10 w-24 bg-card/50 border-border/50 text-foreground rounded-xl"
                              />
                              {errors.temperature && (
                                <p className="text-xs text-destructive mt-2">
                                  {errors.temperature}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground font-medium">
                              {prompt?.temperature || 0.1}
                            </span>
                          )}
                        </TableCell>

                        {/* Prompt Text */}
                        <TableCell className="px-6 py-4 max-w-xs">
                          {isEditing ? (
                            <div>
                              <Textarea
                                name="prompt_text"
                                value={editingData.prompt_text}
                                onChange={handleInputChange}
                                placeholder="Enter AI agent instructions..."
                                className="min-h-[100px] text-sm bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground rounded-xl"
                              />
                              {errors.prompt_text && (
                                <p className="text-xs text-destructive mt-2">
                                  {errors.prompt_text}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="max-w-xs">
                              {prompt?.prompt_text ? (
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {prompt.prompt_text}
                                </p>
                              ) : (
                                <span className="text-muted-foreground/70 italic text-sm">
                                  No configuration set
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right px-6 py-4">
                          {isEditing ? (
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEditing}
                                className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all duration-300"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSavePrompt(daoId)}
                                disabled={isLoading}
                                className="h-10 w-10 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl transition-all duration-300"
                                title="Save"
                              >
                                {createMutation.isPending || updateMutation.isPending ? (
                                  <Loader />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartEditing(daoId)}
                                className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all duration-300"
                                title="Configure"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {prompt && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(prompt.id)}
                                  disabled={deleteMutation.isPending}
                                  className="h-10 w-10 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all duration-300"
                                  title="Delete"
                                >
                                  {deleteMutation.isPending ? (
                                    <Loader />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
