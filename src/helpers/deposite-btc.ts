import {
    styxSDK,
    TransactionPriority,
    type PreparedTransactionData,
    type FeeEstimates,
    type ExecuteTransactionResponse,
} from "@faktoryfun/styx-sdk"

export type WalletProvider = "leather" | "xverse"

export interface DepositParams {
    btcAmount: number
    stxReceiver: string
    btcSender: string
}

export interface TransactionParams {
    amount: string
    userAddress: string
    btcAddress: string
    feePriority: TransactionPriority
    walletProvider: WalletProvider
}

export interface ExecuteParams {
    depositId: string
    preparedData: PreparedTransactionData
    walletProvider: WalletProvider
    btcAddress: string
}

/**
 * Get current Bitcoin network fee estimates
 */
export async function getFeeEstimates() {
    console.log("Getting fee estimates")
    try {
        const fees = await styxSDK.getFeeEstimates()
        console.log("Fee estimates received", fees)
        return { success: true, data: fees as FeeEstimates }
    } catch (error: any) {
        console.error("Error getting fee estimates:", error)
        return { success: false, error }
    }
}

/**
 * Create a new deposit
 */
export async function createDeposit(params: DepositParams) {
    console.log("Creating deposit with params:", params)
    try {
        const depositId = await styxSDK.createDeposit({
            btcAmount: params.btcAmount,
            stxReceiver: params.stxReceiver,
            btcSender: params.btcSender,
        })
        console.log("Deposit created with ID:", depositId)
        return { success: true, depositId }
    } catch (error: any) {
        console.error("Error creating deposit:", error)
        // Log more details if available
        if (error.response) {
            console.error("Error response data:", error.response.data)
            console.error("Error response status:", error.response.status)
        }
        return { success: false, error }
    }
}

/**
 * Prepare a transaction with UTXOs and fee calculation
 */
export async function prepareTransaction(params: TransactionParams) {
    // Convert amount to satoshis if it's in BTC format
    const amountInBtc = Number.parseFloat(params.amount)
    const amountInSatoshis = Math.floor(amountInBtc * 100000000).toString()

    // Log the parameters for debugging
    console.log("Preparing transaction with params:", {
        originalAmount: params.amount,
        convertedAmount: amountInSatoshis,
        userAddress: params.userAddress,
        btcAddress: params.btcAddress,
        feePriority: params.feePriority,
        walletProvider: params.walletProvider,
    })

    try {
        // Call the SDK with satoshi amount
        console.log("Calling styxSDK.prepareTransaction")
        const preparedData = await styxSDK.prepareTransaction({
            amount: amountInSatoshis,
            userAddress: params.userAddress,
            btcAddress: params.btcAddress,
            feePriority: params.feePriority,
            walletProvider: params.walletProvider,
        })

        console.log("Transaction prepared successfully:", preparedData)
        return { success: true, preparedData }
    } catch (error: any) {
        console.error("Error preparing transaction:", error)

        // Log detailed error information
        console.error("Error object:", JSON.stringify(error, null, 2))

        if (error.response) {
            console.error("Error response data:", error.response.data)
            console.error("Error response status:", error.response.status)
            console.error("Error response headers:", error.response.headers)

            // Check for specific inscription-related error with more robust detection
            const errorData = error.response.data
            const errorMessage = typeof errorData === "string" ? errorData : errorData?.message || JSON.stringify(errorData)

            if (
                errorMessage.includes("Insufficient funds after filtering") &&
                errorMessage.includes("UTXOs with inscriptions")
            ) {
                console.log("Detected inscription-related error")
                return {
                    success: false,
                    error: "Insufficient funds after filtering out UTXOs with inscriptions",
                    details: errorData,
                    isInscriptionError: true,
                    inscriptionHelp:
                        "Your Bitcoin address contains inscriptions (Ordinals/NFTs) that are being protected. Use an address without inscriptions or add more regular BTC.",
                }
            }
        } else if (error.request) {
            console.error("Error request:", error.request)
        } else {
            console.error("Error message:", error.message)
        }

        // Add more detailed error information
        const errorMessage = error.response?.data?.message || error.response?.data || error.message || "Unknown error"
        return {
            success: false,
            error: errorMessage,
            details: error.response?.data || error,
        }
    }
}

/**
 * Execute a prepared transaction
 */
export async function executeTransaction(params: ExecuteParams) {
    console.log("Executing transaction with params:", {
        depositId: params.depositId,
        preparedData: "...", // Don't log the full prepared data as it could be large
        walletProvider: params.walletProvider,
        btcAddress: params.btcAddress,
    })

    try {
        const result = (await styxSDK.executeTransaction({
            depositId: params.depositId,
            preparedData: params.preparedData,
            walletProvider: params.walletProvider,
            btcAddress: params.btcAddress,
        })) as ExecuteTransactionResponse
        console.log("Transaction executed successfully:", result)
        return { success: true, result }
    } catch (error: any) {
        console.error("Error executing transaction:", error)
        if (error.response) {
            console.error("Error response data:", error.response.data)
            console.error("Error response status:", error.response.status)
        }
        return { success: false, error }
    }
}

/**
 * Complete deposit flow - from preparation to execution
 */
export async function completeDepositFlow({
    btcAmount,
    stxReceiver,
    btcSender,
    walletProvider,
    feePriority = TransactionPriority.Medium,
}: {
    btcAmount: number
    stxReceiver: string
    btcSender: string
    walletProvider: WalletProvider
    feePriority?: TransactionPriority
}) {
    console.log("Starting complete deposit flow with params:", {
        btcAmount,
        stxReceiver,
        btcSender,
        walletProvider,
        feePriority,
    })

    try {
        // Validate inputs
        console.log("Validating inputs")
        if (!stxReceiver.startsWith("SP")) {
            console.error("Invalid STX address format")
            return { success: false, error: "STX address must start with 'SP'", step: "validation" }
        }

        if (!btcSender.startsWith("bc1") && !btcSender.startsWith("1") && !btcSender.startsWith("3")) {
            console.error("Invalid BTC address format")
            return { success: false, error: "BTC address must be a valid Bitcoin address", step: "validation" }
        }

        if (btcAmount < 0.0001 || btcAmount > 0.002) {
            console.error("Invalid amount")
            return { success: false, error: "Amount must be between 0.0001 and 0.002 BTC", step: "validation" }
        }

        // 1. Create deposit
        console.log("Step 1 - Creating deposit")
        const depositResult = await createDeposit({
            btcAmount,
            stxReceiver,
            btcSender,
        })

        if (!depositResult.success) {
            console.error("Deposit creation failed")
            return { success: false, error: depositResult.error, step: "create_deposit" }
        }

        const depositId = depositResult.depositId
        console.log("Deposit created with ID:", depositId)

        // 2. Prepare transaction - convert to satoshis
        console.log("Step 2 - Preparing transaction")
        const amountInSatoshis = Math.floor(btcAmount * 100000000).toString()
        console.log("Amount in satoshis:", amountInSatoshis)

        const prepareResult = await prepareTransaction({
            amount: amountInSatoshis,
            userAddress: stxReceiver,
            btcAddress: btcSender,
            feePriority,
            walletProvider,
        })

        if (!prepareResult.success) {
            console.error("Transaction preparation failed")
            return {
                success: false,
                error: prepareResult.error,
                step: "prepare_transaction",
                details: prepareResult.details,
                isInscriptionError: prepareResult.isInscriptionError,
            }
        }

        console.log("Transaction prepared successfully")

        // 3. Execute transaction
        console.log("Step 3 - Executing transaction")
        const executeResult = await executeTransaction({
            depositId,
            preparedData: prepareResult.preparedData,
            walletProvider,
            btcAddress: btcSender,
        })

        if (!executeResult.success) {
            console.error("Transaction execution failed")
            return { success: false, error: executeResult.error, step: "execute_transaction" }
        }

        console.log("Transaction executed successfully")

        // Status update step removed as requested

        console.log("Complete deposit flow finished successfully")
        return {
            success: true,
            depositId,
            preparedData: prepareResult.preparedData,
            executionResult: executeResult.result,
        }
    } catch (error: any) {
        console.error("Error in complete deposit flow:", error)
        if (error.response) {
            console.error("Error response data:", error.response.data)
        }
        return { success: false, error, step: "complete_flow" }
    }
}
