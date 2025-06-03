"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Trash2, Check, X, Pencil, Settings } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

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
import { useAuth } from "@/hooks/useAuth";

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

// Define types for editing data
interface EditingData {
  id: string;
  prompt_text: string;
  model: string;
  temperature: number;
}

// Define types for mutations
type CreateMutationType = UseMutationResult<
  AgentPrompt,
  Error,
  Omit<AgentPrompt, "id" | "created_at" | "updated_at">,
  unknown
>;

type UpdateMutationType = UseMutationResult<
  AgentPrompt,
  Error,
  {
    id: string;
    data: Partial<Omit<AgentPrompt, "id" | "created_at" | "updated_at">>;
  },
  unknown
>;

type DeleteMutationType = UseMutationResult<void, Error, string, unknown>;

// Mobile Card Component for individual DAO configurations
function MobileConfigCard({
  daoId,
  daoName,
  prompt,
  isEditing,
  editingData,
  errors,
  onStartEditing,
  onCancelEditing,
  onSavePrompt,
  onDelete,
  onInputChange,
  onSelectChange,
  isLoading,
  createMutation,
  updateMutation,
  deleteMutation,
}: {
  daoId: string;
  daoName: string;
  prompt?: AgentPrompt;
  isEditing: boolean;
  editingData: EditingData;
  errors: Record<string, string>;
  onStartEditing: (daoId: string) => void;
  onCancelEditing: () => void;
  onSavePrompt: (daoId: string) => void;
  onDelete: (promptId: string) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (field: keyof EditingData, value: string) => void;
  isLoading: boolean;
  createMutation: CreateMutationType;
  updateMutation: UpdateMutationType;
  deleteMutation: DeleteMutationType;
}) {
  return (
    <div className="bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-2xl border border-border/30 p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-lg hover:shadow-xl transition-all duration-300 group/card">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary shadow-sm" />
          <h4 className="font-bold text-foreground text-base sm:text-lg truncate">{daoName}</h4>
        </div>
        
        {/* Status Badge */}
        {prompt?.is_active ? (
          <Badge className="bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 text-emerald-500 border-emerald-500/40 px-2 py-1 font-semibold tracking-wide shadow-sm text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Active
          </Badge>
        ) : (
          <Badge className="bg-gradient-to-r from-muted/50 to-muted/30 text-muted-foreground border-muted/40 px-2 py-1 font-semibold tracking-wide shadow-sm text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mr-1.5" />
            Disabled
          </Badge>
        )}
      </div>

      {/* Configuration Content */}
      <div className="space-y-4">
        {/* AI Model */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">AI Model</label>
          {isEditing ? (
            <Select
              value={editingData.model}
              onValueChange={(value) => onSelectChange('model', value)}
            >
              <SelectTrigger className="h-11 w-full bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-medium text-sm">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-xl border-border/40 rounded-xl shadow-xl">
                <SelectItem value="gpt-4o" className="text-foreground hover:bg-primary/10 rounded-lg p-2 font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    GPT-4o
                  </div>
                </SelectItem>
                <SelectItem value="gpt-4o-mini" className="text-foreground hover:bg-primary/10 rounded-lg p-2 font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    GPT-4o Mini
                  </div>
                </SelectItem>
                <SelectItem value="gpt-4.1-nano" className="text-foreground hover:bg-primary/10 rounded-lg p-2 font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    GPT-4.1 Nano
                  </div>
                </SelectItem>
                <SelectItem value="gpt-4.1-mini" className="text-foreground hover:bg-primary/10 rounded-lg p-2 font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    GPT-4.1 Mini
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-xl border border-border/20">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="text-muted-foreground font-semibold text-sm">
                {prompt?.model || "gpt-4o"}
              </span>
            </div>
          )}
        </div>

        {/* Creativity Level */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Creativity Level</label>
          {isEditing ? (
            <div className="space-y-2">
              <Input
                name="temperature"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={editingData.temperature}
                onChange={onInputChange}
                className="h-11 w-full bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-medium text-center text-sm"
              />
              {errors.temperature && (
                <p className="text-xs text-destructive font-medium">
                  {errors.temperature}
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-muted/20 rounded-xl border border-border/20">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                    style={{ width: `${((prompt?.temperature || 0.1) * 100)}%` }}
                  />
                </div>
                <span className="text-muted-foreground font-semibold text-sm w-8 text-right">
                  {prompt?.temperature || 0.1}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Instructions</label>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                name="prompt_text"
                value={editingData.prompt_text}
                onChange={onInputChange}
                placeholder="Enter detailed AI agent instructions and decision-making criteria..."
                className="min-h-[120px] max-h-[200px] text-sm bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground placeholder:text-muted-foreground/70 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-light leading-relaxed resize-none"
              />
              {errors.prompt_text && (
                <p className="text-xs text-destructive font-medium">
                  {errors.prompt_text}
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-muted/20 rounded-xl border border-border/20 min-h-[80px]">
              {prompt?.prompt_text ? (
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  {prompt.prompt_text}
                </p>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground/70 italic text-sm font-light">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  No configuration set
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-2 pt-2 border-t border-border/20">
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEditing}
              className="h-10 px-4 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 rounded-xl transition-all duration-300 group/cancel shadow-sm hover:shadow-md"
            >
              <X className="h-4 w-4 mr-2 group-hover/cancel:scale-110 transition-transform duration-300" />
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSavePrompt(daoId)}
              disabled={isLoading}
              className="h-10 px-4 text-emerald-500 hover:text-emerald-400 hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-emerald-400/20 rounded-xl transition-all duration-300 group/save shadow-sm hover:shadow-md"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Loader />
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg animate-pulse" />
                  </div>
                  Saving...
                </div>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2 group-hover/save:scale-110 transition-transform duration-300" />
                  Save
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStartEditing(daoId)}
              className="h-10 px-4 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 rounded-xl transition-all duration-300 group/edit shadow-sm hover:shadow-md"
            >
              <Pencil className="h-4 w-4 mr-2 group-hover/edit:scale-110 transition-transform duration-300" />
              Configure
            </Button>
            {prompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(prompt.id)}
                disabled={deleteMutation.isPending}
                className="h-10 px-4 text-rose-500 hover:text-rose-400 hover:bg-gradient-to-r hover:from-rose-500/20 hover:to-rose-400/20 rounded-xl transition-all duration-300 group/delete shadow-sm hover:shadow-md"
              >
                {deleteMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Loader />
                      <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-lg animate-pulse" />
                    </div>
                    Deleting...
                  </div>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2 group-hover/delete:scale-110 transition-transform duration-300" />
                    Delete
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function AgentPromptForm() {
  const queryClient = useQueryClient();
  const { agentWallets, balances, fetchWallets } = useWalletStore();
  const { userId } = useAuth();
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    
    if (name === 'temperature') {
      const numValue = parseFloat(value);
      setEditingData({ ...editingData, temperature: numValue });
    } else {
      setEditingData({ ...editingData, [name]: value });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSelectChange = (field: keyof EditingData, value: string) => {
    setEditingData({ ...editingData, [field]: value });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!editingData.prompt_text.trim()) {
      newErrors.prompt_text = "Instructions are required";
    } else if (editingData.prompt_text.length < 10) {
      newErrors.prompt_text = "Instructions must be at least 10 characters";
    } else if (editingData.prompt_text.length > 2000) {
      newErrors.prompt_text = "Instructions must be less than 2000 characters";
    }

    if (
      editingData.temperature < 0 ||
      editingData.temperature > 1 ||
      isNaN(editingData.temperature)
    ) {
      newErrors.temperature = "Temperature must be between 0 and 1";
    }

    if (!editingData.model) {
      newErrors.model = "Model selection is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePrompt = (daoId: string) => {
    if (!validateForm()) return;

    if (editingData.id) {
      // Update existing prompt
      updateMutation.mutate({
        id: editingData.id,
        data: {
          prompt_text: editingData.prompt_text,
          model: editingData.model,
          temperature: editingData.temperature,
          is_active: true,
        },
      });
    } else {
      // Create new prompt
      createMutation.mutate({
        dao_id: daoId,
        agent_id: daoManagerAgentId,
        profile_id: userId || "",
        prompt_text: editingData.prompt_text,
        model: editingData.model,
        temperature: editingData.temperature,
        is_active: true,
      });
    }
  };

  const handleDelete = (promptId: string) => {
    if (window.confirm("Are you sure you want to delete this configuration?")) {
      deleteMutation.mutate(promptId);
    }
  };

  // Check if any mutation is loading
  const isLoading =
    isLoadingPrompts ||
    isLoadingDaos ||
    isLoadingAgents ||
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
    <div className="w-full space-y-8 sm:space-y-12">
      {/* Wallet Info Section */}
      {daoManagerAgentId && (
        <div className="relative">
          <WalletInfoCard
            walletAddress={daoManagerWalletAddress}
            walletBalance={daoManagerWalletBalance}
          />
        </div>
      )}

      {/* Agent Prompts Section */}
      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">AI Agent Configuration</h3>
          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            Configure how your AI agent responds to DAO proposals across different organizations. 
            <span className="text-primary font-medium"> Fine-tune behavior and decision-making parameters.</span>
          </p>
        </div>

        {/* Mobile/Tablet Layout - Cards */}
        <div className="lg:hidden space-y-4">
          {isLoading && uniqueDaoIds.length === 0 ? (
            <div className="text-center py-12 space-y-6">
              <div className="relative mx-auto w-fit">
                <Loader />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              </div>
              <div className="space-y-3">
                <p className="text-lg font-semibold text-foreground">Loading configurations...</p>
                <p className="text-muted-foreground font-light">Initializing AI agent settings</p>
              </div>
            </div>
          ) : uniqueDaoIds.length === 0 ? (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30 flex items-center justify-center shadow-lg">
                <Settings className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <div className="space-y-3 max-w-sm mx-auto">
                <h4 className="text-lg font-semibold text-foreground">No DAOs Available</h4>
                <p className="text-muted-foreground font-light leading-relaxed text-sm">
                  Available DAOs will appear here for AI agent configuration. Connect to organizations to begin automated governance.
                </p>
              </div>
            </div>
          ) : (
            uniqueDaoIds.map((daoId) => {
              const prompt = prompts.find((p) => p.dao_id === daoId);
              const daoName = getDaoName(daoId);
              const isEditing = editingDaoId === daoId;

              return (
                <MobileConfigCard
                  key={daoId}
                  daoId={daoId}
                  daoName={daoName}
                  prompt={prompt}
                  isEditing={isEditing}
                  editingData={editingData}
                  errors={errors}
                  onStartEditing={handleStartEditing}
                  onCancelEditing={handleCancelEditing}
                  onSavePrompt={handleSavePrompt}
                  onDelete={handleDelete}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                  isLoading={isLoading}
                  createMutation={createMutation}
                  updateMutation={updateMutation}
                  deleteMutation={deleteMutation}
                />
              );
            })
          )}
        </div>

        {/* Desktop Layout - Table */}
        <div className="hidden lg:block bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-3xl border border-border/30 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group">
          {/* Enhanced Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 bg-gradient-to-r from-muted/40 via-muted/30 to-muted/20 backdrop-blur-sm">
                  <TableHead className="text-foreground font-bold px-8 py-6 text-base tracking-wide w-[200px]">
                    DAO Organization
                  </TableHead>
                  <TableHead className="text-foreground font-bold px-8 py-6 text-base tracking-wide w-[120px]">
                    Status
                  </TableHead>
                  <TableHead className="text-foreground font-bold px-8 py-6 text-base tracking-wide w-[150px]">
                    AI Model
                  </TableHead>
                  <TableHead className="text-foreground font-bold px-8 py-6 text-base tracking-wide w-[120px]">
                    Creativity
                  </TableHead>
                  <TableHead className="text-foreground font-bold px-8 py-6 text-base tracking-wide min-w-[300px]">
                    Instructions
                  </TableHead>
                  <TableHead className="text-right text-foreground font-bold px-8 py-6 text-base tracking-wide w-[120px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && uniqueDaoIds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center space-y-6">
                        <div className="relative">
                          <Loader />
                          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                        </div>
                        <div className="space-y-3">
                          <p className="text-lg font-semibold text-foreground">Loading configurations...</p>
                          <p className="text-muted-foreground font-light">Initializing AI agent settings</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : uniqueDaoIds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center space-y-8">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30 flex items-center justify-center shadow-lg">
                          <Settings className="h-10 w-10 text-muted-foreground/60" />
                        </div>
                        <div className="space-y-4 max-w-md">
                          <h4 className="text-xl font-semibold text-foreground">No DAOs Available</h4>
                          <p className="text-muted-foreground font-light leading-relaxed">
                            Available DAOs will appear here for AI agent configuration. Connect to organizations to begin automated governance.
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
                      <TableRow 
                        key={daoId} 
                        className="border-border/20 hover:bg-gradient-to-r hover:from-muted/20 hover:via-muted/10 hover:to-transparent transition-all duration-300 group/row"
                      >
                        <TableCell className="font-bold text-foreground px-8 py-6 text-base w-[200px]">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary shadow-sm" />
                            <span className="truncate">{daoName}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="px-8 py-6 w-[120px]">
                          {prompt?.is_active ? (
                            <Badge className="bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 text-emerald-500 border-emerald-500/40 px-3 py-1.5 font-semibold tracking-wide shadow-sm hover:shadow-md transition-all duration-300 text-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gradient-to-r from-muted/50 to-muted/30 text-muted-foreground border-muted/40 px-3 py-1.5 font-semibold tracking-wide shadow-sm text-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mr-1.5" />
                              Disabled
                            </Badge>
                          )}
                        </TableCell>

                        {/* Enhanced Model Selection */}
                        <TableCell className="px-8 py-6 w-[150px]">
                          {isEditing ? (
                            <Select
                              value={editingData.model}
                              onValueChange={(value) => handleSelectChange('model', value)}
                            >
                              <SelectTrigger className="h-10 w-full bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-medium text-sm">
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent className="bg-card/95 backdrop-blur-xl border-border/40 rounded-xl shadow-xl">
                                <SelectItem value="gpt-4o" className="text-foreground hover:bg-primary/10 rounded-lg p-2 font-medium text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    GPT-4o
                                  </div>
                                </SelectItem>
                                <SelectItem value="gpt-4o-mini" className="text-foreground hover:bg-primary/10 rounded-lg p-2 font-medium text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                    GPT-4o Mini
                                  </div>
                                </SelectItem>
                                <SelectItem value="gpt-4.1-nano" className="text-foreground hover:bg-primary/10 rounded-lg p-2 font-medium text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    GPT-4.1 Nano
                                  </div>
                                </SelectItem>
                                <SelectItem value="gpt-4.1-mini" className="text-foreground hover:bg-primary/10 rounded-lg p-2 font-medium text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    GPT-4.1 Mini
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                              <span className="text-muted-foreground font-semibold text-sm truncate">
                                {prompt?.model || "gpt-4o"}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {/* Enhanced Temperature */}
                        <TableCell className="px-8 py-6 w-[120px]">
                          {isEditing ? (
                            <div className="space-y-1">
                              <Input
                                name="temperature"
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={editingData.temperature}
                                onChange={handleInputChange}
                                className="h-10 w-20 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-medium text-center text-sm"
                              />
                              {errors.temperature && (
                                <p className="text-xs text-destructive font-medium">
                                  {errors.temperature}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted/30 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                                  style={{ width: `${((prompt?.temperature || 0.1) * 100)}%` }}
                                />
                              </div>
                              <span className="text-muted-foreground font-semibold text-xs w-8 text-right">
                                {prompt?.temperature || 0.1}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {/* Enhanced Prompt Text */}
                        <TableCell className="px-8 py-6 min-w-[300px]">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Textarea
                                name="prompt_text"
                                value={editingData.prompt_text}
                                onChange={handleInputChange}
                                placeholder="Enter detailed AI agent instructions and decision-making criteria..."
                                className="min-h-[100px] max-h-[150px] text-sm bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground placeholder:text-muted-foreground/70 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-light leading-relaxed resize-none"
                              />
                              {errors.prompt_text && (
                                <p className="text-xs text-destructive font-medium">
                                  {errors.prompt_text}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              {prompt?.prompt_text ? (
                                <div className="group/prompt">
                                  <p className="text-sm text-muted-foreground line-clamp-3 font-light leading-relaxed group-hover/prompt:line-clamp-none transition-all duration-300">
                                    {prompt.prompt_text}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground/70 italic text-sm font-light">
                                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                                  No configuration set
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Enhanced Actions */}
                        <TableCell className="text-right px-8 py-6 w-[120px]">
                          {isEditing ? (
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEditing}
                                className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 rounded-xl transition-all duration-300 group/cancel shadow-sm hover:shadow-md"
                                title="Cancel editing"
                              >
                                <X className="h-4 w-4 group-hover/cancel:scale-110 transition-transform duration-300" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSavePrompt(daoId)}
                                disabled={isLoading}
                                className="h-10 w-10 p-0 text-emerald-500 hover:text-emerald-400 hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-emerald-400/20 rounded-xl transition-all duration-300 group/save shadow-sm hover:shadow-md"
                                title="Save configuration"
                              >
                                {createMutation.isPending || updateMutation.isPending ? (
                                  <div className="relative">
                                    <Loader />
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg animate-pulse" />
                                  </div>
                                ) : (
                                  <Check className="h-4 w-4 group-hover/save:scale-110 transition-transform duration-300" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartEditing(daoId)}
                                className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 rounded-xl transition-all duration-300 group/edit shadow-sm hover:shadow-md"
                                title="Configure agent"
                              >
                                <Pencil className="h-4 w-4 group-hover/edit:scale-110 transition-transform duration-300" />
                              </Button>
                              {prompt && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(prompt.id)}
                                  disabled={deleteMutation.isPending}
                                  className="h-10 w-10 p-0 text-rose-500 hover:text-rose-400 hover:bg-gradient-to-r hover:from-rose-500/20 hover:to-rose-400/20 rounded-xl transition-all duration-300 group/delete shadow-sm hover:shadow-md"
                                  title="Delete configuration"
                                >
                                  {deleteMutation.isPending ? (
                                    <div className="relative">
                                      <Loader />
                                      <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-lg animate-pulse" />
                                    </div>
                                  ) : (
                                    <Trash2 className="h-4 w-4 group-hover/delete:scale-110 transition-transform duration-300" />
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
