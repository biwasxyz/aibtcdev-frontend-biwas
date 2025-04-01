"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2, Edit, Wallet } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { WalletInfoCard } from "./agent-wallet-info";

import { fetchDAOs } from "@/queries/daoQueries";
import { fetchAgents } from "@/queries/agentQueries";
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
  name: string;
  description?: string;
  prompt_text: string;
  prompt_type: string;
  is_active: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export function AgentPromptForm() {
  const queryClient = useQueryClient();
  const { agentWallets, balances, fetchWallets } = useWalletStore();
  const { userId } = useSessionStore();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prompt_text: "",
    prompt_type: "system",
    is_active: true,
    metadata: {},
  });

  // Selection state
  const [selectedDaoId, setSelectedDaoId] = useState<string>("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Fetch all prompts immediately
  const {
    data: prompts = [],
    isLoading: isLoadingPrompts,
    refetch: refetchPrompts,
  } = useQuery({
    queryKey: ["agent_prompts"],
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
      // Since we're filtering for "DAO Manager" in the query, we can use the first item
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
      queryClient.invalidateQueries({ queryKey: ["agent_prompts"] });
      refetchPrompts();
      resetForm();
      setIsDialogOpen(false);
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
      queryClient.invalidateQueries({ queryKey: ["agent_prompts"] });
      refetchPrompts();
      setIsDialogOpen(false);
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
      queryClient.invalidateQueries({ queryKey: ["agent_prompts"] });
      refetchPrompts();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete prompt: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Reset form and selection
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      prompt_text: "",
      prompt_type: "system",
      is_active: true,
      metadata: {},
    });
    setSelectedPromptId(null);
    setSelectedDaoId("");
    setIsCreatingNew(false);
    setErrors({});
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.prompt_text.trim()) {
      newErrors.prompt_text = "Prompt text is required";
    }

    if (!formData.prompt_type) {
      newErrors.prompt_type = "Prompt type is required";
    }

    if (!selectedDaoId) {
      newErrors.dao_id = "DAO is required";
    }

    if (!daoManagerAgentId) {
      newErrors.agent_id = "DAO Manager agent not found";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const promptData = {
      ...formData,
      dao_id: selectedDaoId,
      agent_id: daoManagerAgentId, // Always use the DAO Manager agent
      metadata: formData.metadata || {},
    };

    if (selectedPromptId && !isCreatingNew) {
      updateMutation.mutate({
        id: selectedPromptId,
        data: promptData,
      });
    } else {
      createMutation.mutate(promptData);
    }
  };

  // Handle prompt selection for editing
  const handleEditPrompt = (promptId: string) => {
    const selectedPrompt = prompts.find((p) => p.id === promptId);
    if (selectedPrompt) {
      setSelectedPromptId(promptId);
      setSelectedDaoId(selectedPrompt.dao_id);
      setIsCreatingNew(false);

      setFormData({
        name: selectedPrompt.name,
        description: selectedPrompt.description || "",
        prompt_text: selectedPrompt.prompt_text,
        prompt_type: selectedPrompt.prompt_type,
        is_active: selectedPrompt.is_active,
        metadata: selectedPrompt.metadata || {},
      });

      setErrors({});
      setIsDialogOpen(true);
    }
  };

  // Handle creating a new prompt
  const handleCreateNew = () => {
    resetForm();
    setIsCreatingNew(true);
    setIsDialogOpen(true);
  };

  // Handle deleting a prompt
  const handleDelete = () => {
    if (selectedPromptId) {
      if (confirm("Are you sure you want to delete this prompt?")) {
        deleteMutation.mutate(selectedPromptId);
        setIsDialogOpen(false);
      }
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
    return dao ? dao.name : "Unknown DAO";
  };

  // Get Agent name by ID
  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.name || "Unknown Agent";
  };

  // Get wallet information for an agent
  const getAgentWalletInfo = (agentId: string) => {
    if (!agentId) return { walletAddress: null, walletBalance: null };

    const agentWallet = agentWallets.find(
      (wallet) => wallet.agent_id === agentId
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

  return (
    <Card className="border-none shadow-none bg-background/40 backdrop-blur">
      {daoManagerAgentId && (
        <div className="mb-6">
          <WalletInfoCard
            walletAddress={daoManagerWalletAddress}
            walletBalance={daoManagerWalletBalance}
          />
        </div>
      )}
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base sm:text-2xl font-medium">
          Agent Prompts
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateNew}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Prompt
        </Button>
      </CardHeader>
      <CardContent>
        {/* DAO Manager Wallet Info Card */}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>DAO</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prompt Text</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPrompts ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : prompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No prompts found. Create a new one.
                  </TableCell>
                </TableRow>
              ) : (
                prompts.map((prompt) => (
                  <TableRow key={prompt.id}>
                    <TableCell className="font-medium">{prompt.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{prompt.prompt_type}</Badge>
                    </TableCell>
                    <TableCell>{getDaoName(prompt.dao_id)}</TableCell>
                    <TableCell>{getAgentName(prompt.agent_id)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={prompt.is_active ? "default" : "secondary"}
                        className={
                          prompt.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {prompt.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate text-sm text-muted-foreground">
                        {prompt.prompt_text}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPrompt(prompt.id)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPromptId(prompt.id);
                          if (
                            confirm(
                              "Are you sure you want to delete this prompt?"
                            )
                          ) {
                            deleteMutation.mutate(prompt.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {isCreatingNew ? "Create New Prompt" : "Edit Prompt"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Prompt name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select DAO</label>
                  <Select
                    value={selectedDaoId}
                    onValueChange={setSelectedDaoId}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a DAO" />
                    </SelectTrigger>
                    <SelectContent>
                      {daos.map((dao) => (
                        <SelectItem key={dao.id} value={dao.id}>
                          {dao.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.dao_id && (
                    <p className="text-sm text-red-500">{errors.dao_id}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Agent</label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    {isLoadingAgents
                      ? "(Loading...)"
                      : getAgentName(daoManagerAgentId)}
                  </div>
                  {errors.agent_id && (
                    <p className="text-sm text-red-500">{errors.agent_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Prompt Type</label>
                  <Select
                    value={formData.prompt_type}
                    onValueChange={(value) =>
                      handleSelectChange("prompt_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a prompt type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                      <SelectItem value="function">Function</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.prompt_type && (
                    <p className="text-sm text-red-500">{errors.prompt_type}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Prompt description"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt Text</label>
                <Textarea
                  name="prompt_text"
                  value={formData.prompt_text}
                  onChange={handleInputChange}
                  placeholder="Enter the prompt text"
                  className="min-h-[150px]"
                />
                {errors.prompt_text && (
                  <p className="text-sm text-red-500">{errors.prompt_text}</p>
                )}
              </div>

              <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Active</label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this prompt
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("is_active", checked)
                  }
                />
              </div>

              <DialogFooter>
                {!isCreatingNew && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="mr-auto"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
