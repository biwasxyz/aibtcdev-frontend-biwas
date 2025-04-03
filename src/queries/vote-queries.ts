import { supabase } from "@/utils/supabase/client"

export interface Vote {
    id: string
    created_at: string
    dao_id: string
    dao_name: string
    agent_id: string
    agent_name: string
    answer: boolean
    proposal_id: string
    proposal_title: string
    reasoning: string
    tx_id: string
    amount: number | null
    prompt: string
    confidence: number | null
}

/**
 * Fetches votes with related agent, proposal, and DAO information
 * Only returns votes for agents that belong to the current user
 */
export async function fetchVotes(): Promise<Vote[]> {
    // Get the current authenticated user
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        throw new Error("User not authenticated")
    }

    // First, get the user's agents
    const { data: userAgents, error: agentsError } = await supabase.from("agents").select("id").eq("profile_id", user.id)

    if (agentsError) {
        throw agentsError
    }

    // If user has no agents, return empty array
    if (!userAgents || userAgents.length === 0) {
        return []
    }

    // Get agent IDs
    const agentIds = userAgents.map((agent) => agent.id)

    // Fetch votes with a simpler approach - using joins instead of nested selects
    const { data, error } = await supabase
        .from("votes")
        .select(`
            id, 
            created_at, 
            dao_id, 
            agent_id, 
            answer, 
            proposal_id, 
            reasoning, 
            tx_id,
            amount,
            prompt,
            confidence
        `)
        .in("agent_id", agentIds)
        .order("created_at", { ascending: false })

    if (error) {
        throw error
    }

    // Fetch related data in separate queries
    const agentIds2 = Array.from(new Set(data.map((vote) => vote.agent_id)))
    const daoIds = Array.from(new Set(data.map((vote) => vote.dao_id)))
    const proposalIds = Array.from(new Set(data.map((vote) => vote.proposal_id)))

    // Fetch agents
    const { data: agents } = await supabase.from("agents").select("id, name").in("id", agentIds2)

    // Fetch DAOs
    const { data: daos } = await supabase.from("daos").select("id, name").in("id", daoIds)

    // Fetch proposals
    const { data: proposals } = await supabase.from("proposals").select("id, title").in("id", proposalIds)

    // Create lookup maps for faster access
    const agentMap = new Map(agents?.map((agent) => [agent.id, agent.name]) || [])
    const daoMap = new Map(daos?.map((dao) => [dao.id, dao.name]) || [])
    const proposalMap = new Map(proposals?.map((proposal) => [proposal.id, proposal.title]) || [])

    // Transform the data to match our Vote interface
    const transformedVotes = data.map((vote) => ({
        id: vote.id,
        created_at: vote.created_at,
        dao_id: vote.dao_id,
        dao_name: daoMap.get(vote.dao_id) || "Unknown DAO",
        agent_id: vote.agent_id,
        agent_name: agentMap.get(vote.agent_id) || "Unknown Agent",
        answer: vote.answer,
        proposal_id: vote.proposal_id,
        proposal_title: proposalMap.get(vote.proposal_id) || "Unknown Proposal",
        reasoning: vote.reasoning,
        tx_id: vote.tx_id,
        amount: vote.amount,
        prompt: vote.prompt,
        confidence: vote.confidence || null
    }))

    return transformedVotes
}

/**
 * Fetches votes for a specific proposal
 * @param proposalId The ID of the proposal to fetch votes for
 * @returns An array of votes for the specified proposal
 */
export async function fetchProposalVotes(proposalId: string): Promise<Vote[]> {
    // Fetch votes for the specific proposal
    const { data, error } = await supabase
        .from("votes")
        .select(`
            id, 
            created_at, 
            dao_id, 
            agent_id, 
            answer, 
            proposal_id, 
            reasoning, 
            tx_id,
            amount,
            prompt,
            confidence
        `)
        .eq("proposal_id", proposalId)
        .order("created_at", { ascending: false })

    if (error) {
        throw error
    }

    if (!data || data.length === 0) {
        return []
    }

    // Fetch related data in separate queries
    const agentIds = Array.from(new Set(data.map((vote) => vote.agent_id)))
    const daoIds = Array.from(new Set(data.map((vote) => vote.dao_id)))

    // Fetch agents
    const { data: agents } = await supabase.from("agents").select("id, name").in("id", agentIds)

    // Fetch DAOs
    const { data: daos } = await supabase.from("daos").select("id, name").in("id", daoIds)

    // Create lookup maps for faster access
    const agentMap = new Map(agents?.map((agent) => [agent.id, agent.name]) || [])
    const daoMap = new Map(daos?.map((dao) => [dao.id, dao.name]) || [])

    // Transform the data to match our Vote interface
    const transformedVotes = data.map((vote) => ({
        id: vote.id,
        created_at: vote.created_at,
        dao_id: vote.dao_id,
        dao_name: daoMap.get(vote.dao_id) || "Unknown DAO",
        agent_id: vote.agent_id,
        agent_name: agentMap.get(vote.agent_id) || "Unknown Agent",
        answer: vote.answer,
        proposal_id: vote.proposal_id,
        proposal_title: "Current Proposal", // We already know this is for the current proposal
        reasoning: vote.reasoning,
        tx_id: vote.tx_id,
        amount: vote.amount,
        prompt: vote.prompt,
        confidence: vote.confidence || null
    }))

    return transformedVotes
}

