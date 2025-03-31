import { supabase } from "@/utils/supabase/client";


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

// Fetch all agent prompts
export const fetchAgentPrompts = async (): Promise<AgentPrompt[]> => {
    const { data, error } = await supabase
        .from("agent_prompts")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data || [];
};

// Fetch agent prompts by DAO ID
export const fetchAgentPromptsByDao = async (daoId: string): Promise<AgentPrompt[]> => {
    const { data, error } = await supabase
        .from("agent_prompts")
        .select("*")
        .eq("dao_id", daoId)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data || [];
};

// Fetch agent prompts by agent ID
export const fetchAgentPromptsByAgent = async (agentId: string): Promise<AgentPrompt[]> => {
    const { data, error } = await supabase
        .from("agent_prompts")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data || [];
};

// Fetch a specific agent prompt
export const fetchAgentPrompt = async (promptId: string): Promise<AgentPrompt | null> => {
    const { data, error } = await supabase
        .from("agent_prompts")
        .select("*")
        .eq("id", promptId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

// Create a new agent prompt
export const createAgentPrompt = async (prompt: Omit<AgentPrompt, "id" | "created_at" | "updated_at">): Promise<AgentPrompt> => {
    const { data, error } = await supabase
        .from("agent_prompts")
        .insert([prompt])
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
};

// Update an existing agent prompt
export const updateAgentPrompt = async (promptId: string, updates: Partial<Omit<AgentPrompt, "id" | "created_at" | "updated_at">>): Promise<AgentPrompt> => {
    const { data, error } = await supabase
        .from("agent_prompts")
        .update(updates)
        .eq("id", promptId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
};

// Delete an agent prompt
export const deleteAgentPrompt = async (promptId: string): Promise<void> => {
    const { error } = await supabase
        .from("agent_prompts")
        .delete()
        .eq("id", promptId);

    if (error) {
        throw error;
    }
};
