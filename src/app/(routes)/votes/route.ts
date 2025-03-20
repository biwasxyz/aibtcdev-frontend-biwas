import { Cl, cvToJSON } from "@stacks/transactions";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // Cloudflare-friendly runtime

// Select the network dynamically based on the environment variable
const isTestnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet";
const STACKS_API_URL = isTestnet
    ? "https://stacks-node-api.testnet.stacks.co"
    : "https://stacks-node-api.mainnet.stacks.co";

/**
 * API route handler for fetching proposal data from a Stacks smart contract
 * 
 * This implementation uses direct fetch calls to the Stacks API instead of 
 * fetchCallReadOnlyFunction, making it compatible with Edge runtime.
 * 
 * Key improvements:
 * 1. Properly serializes Clarity values using Cl.serialize
 * 2. Correctly deserializes the API response using Cl.deserialize
 * 3. Uses a consistent sender address for the contract call
 * 4. Handles both full proposal data and votes-only responses
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get("contractAddress");
    const proposalId = searchParams.get("proposalId");
    const votesOnly = searchParams.get("votesOnly") === "true";

    if (!contractAddress || !proposalId) {
        return NextResponse.json(
            {
                success: false,
                message: "Missing required parameters: contractAddress or proposalId",
            },
            { status: 400 }
        );
    }

    try {
        // Split the contract address into parts (address.contractName format)
        const [address, contractName] = contractAddress.split(".");

        if (!address || !contractName) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid contract address format. Expected format: address.contractName",
                    data: null,
                },
                { status: 400 }
            );
        }

        // Use a consistent sender address for the contract call
        // This address is used as the caller context for the read-only function
        const senderAddress = "ST000000000000000000002AMW42H";

        // Create a Clarity uint value for the proposalId
        // This is equivalent to what fetchCallReadOnlyFunction does internally
        const functionArg = Cl.uint(Number.parseInt(proposalId));

        // Serialize the Clarity value to a hex string
        // This converts the Clarity value to the format expected by the API
        const serializedArg = Cl.serialize(functionArg);

        // Construct the API URL for the read-only function call
        const apiUrl = `${STACKS_API_URL}/v2/contracts/call-read/${address}/${contractName}/get-proposal`;

        // Prepare the request body with the serialized argument
        // The API expects arguments as hex strings with 0x prefix
        const requestBody = {
            sender: senderAddress,
            arguments: [`0x${serializedArg}`]
        };

        // Make the API call to execute the read-only function
        const response = await fetch(
            apiUrl,
            {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Stacks API returned an error: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();

        // Process the API response
        // The API returns a hex string that needs to be deserialized
        if (result.okay && result.result) {
            // Remove the '0x' prefix if present
            const hexResult = result.result.startsWith('0x')
                ? result.result.slice(2)
                : result.result;

            // Deserialize the hex string back to a Clarity value
            // This is the inverse of the serialization we did earlier
            const clarityValue = Cl.deserialize(hexResult);

            // Convert the Clarity value to a JavaScript object
            const jsonResult = cvToJSON(clarityValue);

            // If votesOnly is true, extract just the votes data
            if (votesOnly) {
                try {
                    const proposalData = jsonResult.value?.value;

                    if (proposalData) {
                        const votesResponse = {
                            success: true,
                            votesFor: proposalData.votesFor?.value,
                            votesAgainst: proposalData.votesAgainst?.value,
                        };

                        return NextResponse.json(votesResponse);
                    }
                } catch {
                    // If we can't extract votes data, fall back to returning the full result
                    // Error parameter removed to fix linter warning
                }
            }

            // Return the full result
            return NextResponse.json({
                success: true,
                message: "Proposal retrieved successfully",
                data: jsonResult,
                proposalId: proposalId,
                contractAddress: contractAddress,
            });
        } else {
            throw new Error("Invalid response format from Stacks API");
        }
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "An unknown error occurred",
                error: String(error),
            },
            { status: 500 }
        );
    }
}