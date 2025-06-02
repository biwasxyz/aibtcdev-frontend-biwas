import type { Proposal } from "@/types/supabase";

/**
 * Safely converts a bigint or null value to a number, returning 0 if null
 */
export const safeNumberFromBigInt = (value: bigint | null): number => {
    return value ? Number(value) : 0;
};

/**
 * Safely converts a string or null value to a string, returning empty string if null
 */
export const safeString = (value: string | null): string => {
    return value || "";
};

/**
 * Safely converts a bigint or null value to a string, returning empty string if null
 */
export const safeStringFromBigInt = (value: bigint | null): string => {
    return value ? String(value) : "";
};

/**
 * Helper to get safe values for VoteProgress component
 */
export const getVoteProgressProps = (proposal: Proposal) => {
    return {
        contractAddress: safeString(proposal.contract_principal),
        proposalId: safeStringFromBigInt(proposal.proposal_id),
        votesFor: safeString(proposal.votes_for),
        votesAgainst: safeString(proposal.votes_against),
        liquidTokens: safeString(proposal.liquid_tokens),
    };
};

/**
 * Helper to get safe values for TimeStatus component
 */
export const getTimeStatusProps = (proposal: Proposal) => {
    return {
        createdAt: proposal.created_at,
        status: proposal.status,
        concludedBy: proposal.concluded_by || undefined,
        vote_start: safeNumberFromBigInt(proposal.vote_start),
        vote_end: safeNumberFromBigInt(proposal.vote_end),
    };
};

/**
 * Helper to get safe values for BlockVisual component
 */
export const getBlockVisualProps = (value: bigint | null) => {
    return safeNumberFromBigInt(value);
}; 