import { supabase } from "@/utils/supabase/client";

export async function fetchAgentPrompts(agentId: string) {
    const { data, error } = await supabase.from("agent_prompts").select("*").eq("agent_id", agentId)
    if (error) throw error;

    return data || []
}