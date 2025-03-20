// Client-side utility functions only
export const formatStacksAddress = (address: string) => {
    if (!address) return ""
    return address.substring(0, 6) + "..." + address.substring(address.length - 6)
}

export const formatStacksAmount = (amount: string) => {
    try {
        const value = BigInt(amount)
        // STX has 6 decimal places
        const formattedAmount = Number(value) / 1_000_000
        return formattedAmount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 6,
        })
    } catch (e) {
        return amount
    }
}

// Functio to get just votes data
export async function getProposalVotes(
    contractAddress: string,
    proposalId: number,
): Promise<{
    success: boolean
    votesFor: string
    votesAgainst: string
    formattedVotesFor: string
    formattedVotesAgainst: string
    error?: string
}> {
    try {
        const response = await fetch(
            `/votes?contractAddress=${encodeURIComponent(contractAddress)}&proposalId=${proposalId}&votesOnly=true`,
        )

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || "Failed to fetch proposal votes")
        }

        const data = await response.json()

        if (!data.success) {
            throw new Error(data.message || "Failed to get votes data")
        }

        return {
            success: true,
            votesFor: data.votesFor,
            votesAgainst: data.votesAgainst,
            formattedVotesFor: formatStacksAmount(data.votesFor),
            formattedVotesAgainst: formatStacksAmount(data.votesAgainst),
        }
    } catch (error) {
        console.error("Error in getProposalVotes:", error)
        return {
            success: false,
            votesFor: "0",
            votesAgainst: "0",
            formattedVotesFor: "0",
            formattedVotesAgainst: "0",
            error: error instanceof Error ? error.message : "An unknown error occurred",
        }
    }
}

