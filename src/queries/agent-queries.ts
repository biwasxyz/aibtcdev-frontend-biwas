import { supabase } from "@/utils/supabase/client"
import type { Agent } from "@/types/supabase"

// Fetch all agents
export const fetchAgents = async (): Promise<Agent[]> => {
    const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("is_archived", { ascending: true })
        .order("name", { ascending: true })

    if (error) throw error
    return data || []
}

// Fetch DAO Manager agent
export const fetchDaoManagerAgent = async (): Promise<Agent | null> => {
    const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("name", "DAO Manager")
        .single()

    if (error) {
        if (error.code === "PGRST116") return null // No rows found
        throw error
    }
    return data
}

// Fetch a specific agent
export const fetchAgent = async (agentId: string): Promise<Agent | null> => {
    const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single()

    if (error) {
        if (error.code === "PGRST116") return null
        throw error
    }
    return data
}

// Create a new agent
export const createAgent = async (agent: Omit<Agent, "id">): Promise<Agent> => {
    const { data, error } = await supabase
        .from("agents")
        .insert([agent])
        .select()
        .single()

    if (error) throw error
    return data
}

// Update an agent
export const updateAgent = async (agentId: string, updates: Partial<Agent>): Promise<Agent> => {
    const { data, error } = await supabase
        .from("agents")
        .update(updates)
        .eq("id", agentId)
        .select()
        .single()

    if (error) throw error
    return data
}

// Archive an agent (instead of deleting)
export const archiveAgent = async (agentId: string): Promise<void> => {
    const { error } = await supabase
        .from("agents")
        .update({ is_archived: true })
        .eq("id", agentId)

    if (error) throw error
}
