"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Loader2, Trash2, Check, X, Pencil } from "lucide-react";
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
    <div className="w-full space-y-4">
      <div className="space-y-4">
        {/* Wallet Info Section */}
        <div className="w-full">
          {daoManagerAgentId && (
            <WalletInfoCard
              walletAddress={daoManagerWalletAddress}
              walletBalance={daoManagerWalletBalance}
            />
          )}
        </div>

        {/* Agent Prompts Section */}
        <div className="w-full space-y-4">
          <div className="w-full overflow-x-auto border rounded-lg p-4 bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h2 className="text-base sm:text-lg lg:text-2xl font-medium">
                Agent Prompts
              </h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/5">DAO</TableHead>
                  <TableHead className="w-1/7">Status</TableHead>
                  <TableHead className="w-1/7">Model</TableHead>
                  <TableHead className="w-1/7">Temperature</TableHead>
                  <TableHead className="w-1/3">Prompt Text</TableHead>
                  <TableHead className="w-1/9 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && uniqueDaoIds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : uniqueDaoIds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No DAOs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  uniqueDaoIds.map((daoId) => {
                    const prompt = prompts.find((p) => p.dao_id === daoId);
                    const daoName = getDaoName(daoId);
                    const isEditing = editingDaoId === daoId;

                    return (
                      <TableRow key={daoId}>
                        <TableCell className="font-medium">{daoName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              prompt?.is_active ? "default" : "secondary"
                            }
                            className={
                              prompt?.is_active
                                ? "bg-green-500/20 text-green-700 hover:bg-green-500/20"
                                : "bg-muted text-muted-foreground hover:bg-muted"
                            }
                          >
                            {prompt?.is_active ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>

                        {/* Model Selection */}
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editingData.model}
                              onValueChange={(value) =>
                                setEditingData({ ...editingData, model: value })
                              }
                            >
                              <SelectTrigger className="h-8 w-full">
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                <SelectItem value="gpt-4o-mini">
                                  GPT-4o Mini
                                </SelectItem>
                                <SelectItem value="gpt-4.1-nano">
                                  GPT-4.1 Nano
                                </SelectItem>
                                <SelectItem value="gpt-4.1-mini">
                                  GPT-4.1 Mini
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span>{prompt?.model || "gpt-4o"}</span>
                          )}
                        </TableCell>

                        {/* Temperature */}
                        <TableCell>
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
                                className="h-8 w-20"
                              />
                              {errors.temperature && (
                                <p className="text-xs text-red-500">
                                  {errors.temperature}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span>{prompt?.temperature || 0.1}</span>
                          )}
                        </TableCell>

                        {/* Prompt Text */}
                        <TableCell>
                          {isEditing ? (
                            <div>
                              <Textarea
                                name="prompt_text"
                                value={editingData.prompt_text}
                                onChange={handleInputChange}
                                placeholder="Enter prompt text"
                                className="min-h-[80px] text-sm"
                              />
                              {errors.prompt_text && (
                                <p className="text-xs text-red-500">
                                  {errors.prompt_text}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="truncate text-sm text-muted-foreground">
                              {prompt?.prompt_text || "No prompt configured"}
                            </p>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEditing}
                                className="h-8 w-8 p-0"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Cancel</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSavePrompt(daoId)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0"
                                title="Save"
                              >
                                {createMutation.isPending ||
                                updateMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                <span className="sr-only">Save</span>
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartEditing(daoId)}
                                className="h-8 w-8 p-0"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              {prompt && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(prompt.id)}
                                  disabled={deleteMutation.isPending}
                                  className="h-8 w-8 p-0"
                                  title="Delete"
                                >
                                  {deleteMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="sr-only">Delete</span>
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
