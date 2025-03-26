export async function getProposalVotes(contractPrincipal: string, proposalId: number) {
    // Parse the contract principal to extract address and name
    const [contractAddress, contractName] = contractPrincipal.split(".")

    if (!contractAddress || !contractName) {
        throw new Error("Invalid contract principal format")
    }

    // Call the endpoint with POST method and the correct request body format
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_CACHE_URL}/contract-calls/read-only/${contractAddress}/${contractName}/get-proposal`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            // Use the required format for the request body
            body: JSON.stringify({
                functionArgs: [
                    {
                        type: "uint",
                        value: proposalId.toString(),
                    },
                ],
                network: process.env.NEXT_PUBLIC_STACKS_NETWORK
            }),
        },
    )

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch proposal votes: ${errorText}`)
    }

    const data = await response.json()

    // Format the votes for display
    const votesFor = data.votesFor || "0"
    const votesAgainst = data.votesAgainst || "0"

    // Calculate formatted votes
    const formattedVotesFor = formatVotes(Number(votesFor) / 1e8)
    const formattedVotesAgainst = formatVotes(Number(votesAgainst) / 1e8)

    return {
        votesFor,
        votesAgainst,
        formattedVotesFor,
        formattedVotesAgainst,
    }
}

// Helper function to format votes with appropriate suffixes
function formatVotes(votes: number): string {
    if (votes === 0) return "0"
    if (votes < 1) return votes.toFixed(2)
    if (votes < 10) return votes.toFixed(1)
    if (votes < 1000) return Math.round(votes).toString()
    if (votes < 1000000) return (votes / 1000).toFixed(1) + "K"
    return (votes / 1000000).toFixed(1) + "M"
}

