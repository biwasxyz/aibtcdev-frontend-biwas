
import { supabase } from "@/utils/supabase/client";
export interface Vote {
    id: string;
    created_at: string;
    dao_id: string;
    dao_name: string;
    agent_id: string;
    agent_name: string;
    answer: boolean;
    proposal_id: string;
    proposal_title: string;
    reasoning: string | null;
    tx_id: string | null;
    amount: number | null;
    prompt: string | null;
    confidence: number | null;
}

interface VoteWithDetails {
    id: string;
    created_at: string;
    dao_id: string;
    agent_id: string;
    answer: boolean;
    proposal_id: string;
    reasoning: string | null;
    tx_id: string | null;
    amount: number | null;
    prompt: string | null;
    confidence: number | null;
    agents: { id: string; name: string }[];
    daos: { id: string; name: string }[];
}


/**
 * WARNING: This function still contains the N+1 query pattern.
 * It fetches votes for the current user's agents and then makes
 * separate calls to get agent, dao, and proposal details.
 * Refactor this similarly to fetchProposalVotes if used on performance-critical pages.
 */
export async function fetchVotes(): Promise<Vote[]> {
    console.warn("fetchVotes function contains N+1 pattern and might need refactoring if used.");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("User not authenticated");

    const { data: userAgents, error: agentsError } = await supabase.from("agents").select("id").eq("profile_id", user.id);
    if (agentsError) throw agentsError;
    if (!userAgents || userAgents.length === 0) return [];
    const agentIds = userAgents.map((agent) => agent.id);

    // Fetch base vote data
    const { data, error } = await supabase
        .from("votes")
        .select(`id, created_at, dao_id, agent_id, answer, proposal_id, reasoning, tx_id, amount, prompt, confidence`)
        .in("agent_id", agentIds)
        .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // N+1 Fetches (Problematic Section)
    const agentIds2 = Array.from(new Set(data.map((vote) => vote.agent_id))).filter(Boolean);
    const daoIds = Array.from(new Set(data.map((vote) => vote.dao_id))).filter(Boolean);
    const proposalIds = Array.from(new Set(data.map((vote) => vote.proposal_id))).filter(Boolean);

    const agents = agentIds2.length > 0 ? await supabase.from("agents").select("id, name").in("id", agentIds2) : { data: [] };
    const daos = daoIds.length > 0 ? await supabase.from("daos").select("id, name").in("id", daoIds) : { data: [] };
    const proposals = proposalIds.length > 0 ? await supabase.from("proposals").select("id, title").in("id", proposalIds) : { data: [] };

    // Create lookup maps
    const agentMap = new Map(agents.data?.map((agent) => [agent.id, agent.name]) || []);
    const daoMap = new Map(daos.data?.map((dao) => [dao.id, dao.name]) || []);
    const proposalMap = new Map(proposals.data?.map((proposal) => [proposal.id, proposal.title]) || []);

    // Transform data into the locally defined Vote interface
    const transformedVotes: Vote[] = data.map((vote) => ({
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
        confidence: vote.confidence ?? null // Ensure null if undefined
    }));

    return transformedVotes;
}

/**
 * CORRECTED & REFACTORED VERSION: Fetches votes for a specific proposal ALONG WITH
 * related agent and DAO names using a single efficient Supabase query.
 * @param proposalId The ID of the proposal to fetch votes for
 * @returns An array of Vote objects for the specified proposal
 */
export async function fetchProposalVotes(proposalId: string): Promise<Vote[]> {
    if (!proposalId) {
        console.warn("fetchProposalVotes called with null or empty proposalId.");
        return [];
    }
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
            confidence,
            agents ( id, name ),
            daos ( id, name )
        `) // Fetch related agents and daos using Supabase joins
        .eq("proposal_id", proposalId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(`Error fetching votes with details for proposal ${proposalId}:`, error);
        throw error; // Let React Query handle the error
    }

    if (!data) {
        return []; // Return empty array if no votes found
    }

    const transformedVotes: Vote[] = data.map((vote: VoteWithDetails) => ({
        // Spread basic vote properties that match
        id: vote.id,
        created_at: vote.created_at,
        dao_id: vote.dao_id,
        agent_id: vote.agent_id,
        answer: vote.answer,
        proposal_id: vote.proposal_id,
        reasoning: vote.reasoning,
        tx_id: vote.tx_id,
        amount: vote.amount,
        prompt: vote.prompt,
        confidence: vote.confidence ?? null,
        agent_name: vote.agents?.[0]?.name || "Unknown Agent",
        dao_name: vote.daos?.[0]?.name || "Unknown DAO",
        proposal_title: "Current Proposal",
    }));

    return transformedVotes;
}

/**
 * Helper function to format vote amounts (e.g., divide by decimals)
 * @param votes Number representing raw vote amount
 * @returns Formatted string representation
 */
export function formatVotes(votes: number | null | undefined): string {
    if (votes === null || votes === undefined || isNaN(votes)) return "0";
    if (votes === 0) return "0";
    // Assuming 1e8 (100,000,000) is the correct decimal place adjustment
    const adjustedVotes = votes / 1e8;
    return adjustedVotes.toString(); // Or use .toLocaleString() for better formatting
}

// Determine cache URL based on environment variable
const url = process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
    ? process.env.NEXT_PUBLIC_CACHE_URL_TESTNET
    : process.env.NEXT_PUBLIC_CACHE_URL;


/**
 * Fetches aggregate proposal votes (For/Against counts) from a Stacks cache/read-only endpoint.
 * This function does NOT cause the Supabase N+1 issue for agents/daos.
 * @param contractPrincipal e.g., "SP123.my-contract"
 * @param proposalId The proposal index (uint)
 * @param bustCache Optionally force a cache refresh
 * @returns Promise resolving to the vote data including formatted counts
 */
export async function getProposalVotes(contractPrincipal: string, proposalId: number | string, bustCache = false) {
    if (!url) {
        console.error("Cache URL environment variable is not set!");
        throw new Error("Cache URL is not configured.");
    }
    if (!contractPrincipal || typeof proposalId === 'undefined') {
        console.error("getProposalVotes called with invalid parameters.");
        throw new Error("Invalid contract principal or proposal ID.");
    }

    const [contractAddress, contractName] = contractPrincipal.split(".");
    if (!contractAddress || !contractName) {
        throw new Error(`Invalid contract principal format: ${contractPrincipal}`);
    }

    const proposalIdString = proposalId.toString();

    try {
        const apiUrl = `${url}/contract-calls/read-only/${contractAddress}/${contractName}/get-proposal`;
        const response = await fetch(
            apiUrl,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    functionArgs: [{ type: "uint", value: proposalIdString }],
                    // Optional: Add cache control if the endpoint supports it
                    cacheControl: bustCache ? { bustCache: true, ttl: 3600 } : undefined,
                }),
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch proposal votes from ${apiUrl}: ${response.status} ${errorText}`);
            throw new Error(`Failed to fetch proposal votes: ${errorText}`);
        }

        const responseData = await response.json();
        const voteData = responseData.data || responseData;

        let votesFor = "0", votesAgainst = "0";
        // Safely access and parse vote counts
        if (voteData && typeof voteData.votesFor === "string") { votesFor = voteData.votesFor.replace(/n$/, ""); }
        else if (voteData && typeof voteData.votesFor === 'number') { votesFor = voteData.votesFor.toString(); }

        if (voteData && typeof voteData.votesAgainst === "string") { votesAgainst = voteData.votesAgainst.replace(/n$/, ""); }
        else if (voteData && typeof voteData.votesAgainst === 'number') { votesAgainst = voteData.votesAgainst.toString(); }

        const votesForNum = !isNaN(Number(votesFor)) ? Number(votesFor) : 0;
        const votesAgainstNum = !isNaN(Number(votesAgainst)) ? Number(votesAgainst) : 0;

        // Return a structured object
        return {
            votesFor: votesFor, // String version without 'n'
            votesAgainst: votesAgainst, // String version without 'n'
            formattedVotesFor: formatVotes(votesForNum),
            formattedVotesAgainst: formatVotes(votesAgainstNum),
        };

    } catch (error) {
        console.error(`Error in getProposalVotes for ${contractPrincipal}, proposal ${proposalId}:`, error);
        throw error; // Re-throw for React Query
    }
}