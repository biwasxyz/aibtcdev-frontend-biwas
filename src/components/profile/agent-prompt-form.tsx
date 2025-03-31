"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

import { fetchDAOs } from "@/queries/daoQueries";
import { fetchAgents } from "@/queries/agentQueries";
import {
  fetchAgentPromptsByDao,
  createAgentPrompt,
  updateAgentPrompt,
  deleteAgentPrompt,
} from "@/queries/agent-prompt-queries";

export interface AgentPrompt {
  id: string;
  dao_id: string;
  agent_id: string;
  name: string;
  description?: string;
  prompt_text: string;
  prompt_type: string;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export function AgentPromptForm() {
  const queryClient = useQueryClient();

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
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { toast } = useToast();

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch DAOs
  const { data: daos = [], isLoading: isLoadingDaos } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
  });

  // Fetch Agents
  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  // Fetch prompts for selected DAO
  const {
    data: prompts = [],
    isLoading: isLoadingPrompts,
    refetch: refetchPrompts,
  } = useQuery({
    queryKey: ["agent_prompts", selectedDaoId],
    queryFn: () => fetchAgentPromptsByDao(selectedDaoId),
    enabled: !!selectedDaoId,
  });

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!selectedDaoId || !selectedAgentId) {
      toast({
        title: "Error",
        description: "Please select a DAO and an agent",
        variant: "destructive",
      });
      return;
    }

    const promptData = {
      ...formData,
      dao_id: selectedDaoId,
      agent_id: selectedAgentId,
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

  // Handle prompt selection
  const handlePromptSelect = (promptId: string) => {
    const selectedPrompt = prompts.find((p) => p.id === promptId);
    if (selectedPrompt) {
      setSelectedPromptId(promptId);
      setSelectedAgentId(selectedPrompt.agent_id);
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
    }
  };

  // Handle creating a new prompt
  const handleCreateNew = () => {
    resetForm();
    setIsCreatingNew(true);
  };

  // Handle deleting a prompt
  const handleDelete = () => {
    if (selectedPromptId) {
      if (confirm("Are you sure you want to delete this prompt?")) {
        deleteMutation.mutate(selectedPromptId);
      }
    }
  };

  // Effect to reset form when DAO changes
  useEffect(() => {
    resetForm();
  }, [selectedDaoId]);

  const isLoading =
    isLoadingDaos ||
    isLoadingAgents ||
    isLoadingPrompts ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Card className="border-none shadow-none bg-background/40 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base sm:text-2xl font-medium">
          DAO-Specific Agent Prompts
        </CardTitle>
        <Separator className="my-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select DAO</label>
            <Select
              value={selectedDaoId}
              onValueChange={(value) => setSelectedDaoId(value)}
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
          </div>

          {selectedDaoId && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Existing Prompts</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateNew}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
              <Select
                value={selectedPromptId || ""}
                onValueChange={handlePromptSelect}
                disabled={isLoading || isCreatingNew}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a prompt or create new" />
                </SelectTrigger>
                <SelectContent>
                  {prompts.map((prompt) => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                      {prompt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {selectedDaoId && (isCreatingNew || selectedPromptId) && (
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

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Agent
                </label>
                <Select
                  value={selectedAgentId}
                  onValueChange={setSelectedAgentId}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents
                      .filter((agent) => !agent.is_archived)
                      .map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={
                  isLoading || isCreatingNew || selectedPromptId === null
                }
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
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
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
