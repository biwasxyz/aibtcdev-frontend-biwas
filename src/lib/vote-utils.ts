export async function getProposalVotes(contractPrincipal: string, proposalId: number, bustCache: boolean = false) {
    // Parse the contract principal to extract address and name
    const [contractAddress, contractName] = contractPrincipal.split(".")

    if (!contractAddress || !contractName) {
        throw new Error("Invalid contract principal format")
    }

    // Call the endpoint with POST method and the correct request body format
    const response = await fetch(
        // NEED TO ADD THIS TO ENV AFTER
        `https://cache-staging.aibtc.dev/contract-calls/read-only/${contractAddress}/${contractName}/get-proposal`,
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

                cacheControl: bustCache ? {
                    bustCache: true,  // Force a fresh request, bypassing the cache
                    ttl: 60           // Cache this result for 60 seconds
                } : undefined
            }),
        },
    )

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch proposal votes: ${errorText}`)
    }

    return await response.json()
}
