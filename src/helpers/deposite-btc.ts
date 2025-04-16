import {
    styxSDK,
    TransactionPriority,
    type PreparedTransactionData,
    type FeeEstimates,
    type ExecuteTransactionResponse,
} from "@faktoryfun/styx-sdk"

export type WalletProvider = "leather" | "xverse"

export interface DepositParams {
    btcAmount: number // This is in BTC as the SDK expects
    stxReceiver: string
    btcSender: string
}

export interface TransactionParams {
    amount: string // This should be in satoshis
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

// Constants for BTC/satoshi conversion
export const SATOSHIS_PER_BTC = 100000000 // 1 BTC = 100,000,000 satoshis

// Min and max values in BTC
export const MIN_BTC_AMOUNT = 0.0001 // 10,000 satoshis
export const MAX_BTC_AMOUNT = 0.002 // 200,000 satoshis

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
            btcAmount: params.btcAmount, // This is in BTC as the SDK expects
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
        // Return the original error
        return {
            success: false,
            error: error,
            errorMessage: error.response?.data || error.message || "Error creating deposit",
        }
    }
}

/**
 * Convert BTC to satoshis
 */
export function btcToSatoshis(btc: number): number {
    return Math.floor(btc * SATOSHIS_PER_BTC)
}

/**
 * Convert satoshis to BTC
 */
export function satoshisToBTC(satoshis: number): number {
    return satoshis / SATOSHIS_PER_BTC
}

/**
 * Format BTC amount for display
 */
export function formatBTC(btc: number): string {
    return btc.toFixed(8)
}

/**
 * Format satoshi amount for display
 */
export function formatSatoshis(satoshis: number): string {
    return satoshis.toLocaleString()
}

/**
 * Validate BTC amount
 */
export function validateBTCAmount(btcAmount: number): { valid: boolean; error?: string } {
    if (isNaN(btcAmount)) {
        return { valid: false, error: "Invalid amount" }
    }

    if (btcAmount < MIN_BTC_AMOUNT) {
        return {
            valid: false,
            error: `Minimum amount is ${MIN_BTC_AMOUNT} BTC (${btcToSatoshis(MIN_BTC_AMOUNT).toLocaleString()} satoshis)`,
        }
    }

    if (btcAmount > MAX_BTC_AMOUNT) {
        return {
            valid: false,
            error: `Maximum amount is ${MAX_BTC_AMOUNT} BTC (${btcToSatoshis(MAX_BTC_AMOUNT).toLocaleString()} satoshis)`,
        }
    }

    return { valid: true }
}

/**
 * Extract error message from SDK error
 */
export function extractErrorMessage(error: any): string {
    if (!error) return "Unknown error"

    // Check for response data first
    if (error.response?.data) {
        const responseData = error.response.data
        if (typeof responseData === "string") return responseData
        if (responseData.message) return responseData.message
        if (responseData.error) return responseData.error
        return JSON.stringify(responseData)
    }

    // Then check for error message
    if (error.message) return error.message

    // If all else fails, stringify the error
    return typeof error === "string" ? error : JSON.stringify(error)
}

/**
 * Prepare a transaction with UTXOs and fee calculation
 */
export async function prepareTransaction(params: TransactionParams) {
    try {
        // Log the parameters for debugging
        console.log("Preparing transaction with params:", {
            amount: params.amount, // This is already in satoshis
            userAddress: params.userAddress,
            btcAddress: params.btcAddress,
            feePriority: params.feePriority,
            walletProvider: params.walletProvider,
        })

        // Call the SDK with satoshi amount
        console.log("Calling styxSDK.prepareTransaction")
        const preparedData = await styxSDK.prepareTransaction({
            amount: params.amount, // This is already in satoshis
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

        // Check for specific error types but preserve original error
        let isInscriptionError = false

        if (error.response) {
            console.error("Error response data:", error.response.data)
            console.error("Error response status:", error.response.status)

            // Check for inscription-related error
            const errorData = error.response.data
            const errorMessage = typeof errorData === "string" ? errorData : errorData?.message || JSON.stringify(errorData)

            if (
                errorMessage.includes("Insufficient funds after filtering") &&
                errorMessage.includes("UTXOs with inscriptions")
            ) {
                console.log("Detected inscription-related error")
                isInscriptionError = true
            }
        }

        // Return the original error along with our analysis
        return {
            success: false,
            error: error,
            errorMessage: extractErrorMessage(error),
            originalError: error,
            isInscriptionError,
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
        preparedData: params.preparedData, // Don't log the full prepared data as it could be large
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

        // Return the original error
        return {
            success: false,
            error: error,
            errorMessage: extractErrorMessage(error),
        }
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

        // Validate BTC amount
        const btcValidation = validateBTCAmount(btcAmount)
        if (!btcValidation.valid) {
            console.error("Invalid BTC amount")
            return {
                success: false,
                error: btcValidation.error || "Invalid BTC amount",
                step: "validation",
            }
        }

        // 1. Create deposit - use BTC amount directly
        console.log("Step 1 - Creating deposit")
        console.log(`Using ${btcAmount} BTC for deposit creation`)

        const depositResult = await createDeposit({
            btcAmount,
            stxReceiver,
            btcSender,
        })

        if (!depositResult.success) {
            console.error("Deposit creation failed")
            return {
                success: false,
                error: depositResult.errorMessage || "Failed to create deposit",
                originalError: depositResult.error,
                step: "create_deposit",
            }
        }

        const depositId = depositResult.depositId
        // Add this check to ensure depositId is defined
        if (!depositId) {
            console.error("Deposit ID is undefined")
            return { success: false, error: "Failed to get deposit ID", step: "create_deposit" }
        }
        console.log("Deposit created with ID:", depositId)

        // 2. Prepare transaction - convert BTC to satoshis
        console.log("Step 2 - Preparing transaction")
        try {
            // Convert BTC to satoshis for the API
            const satoshiAmount = btcToSatoshis(btcAmount)
            console.log(`Converting ${btcAmount} BTC to ${satoshiAmount} satoshis for transaction preparation`)

            const prepareResult = await prepareTransaction({
                amount: satoshiAmount.toString(), // Pass the satoshi amount
                userAddress: stxReceiver,
                btcAddress: btcSender,
                feePriority,
                walletProvider,
            })

            if (!prepareResult.success) {
                console.error("Transaction preparation failed")
                return {
                    success: false,
                    error: prepareResult.errorMessage || "Failed to prepare transaction",
                    originalError: prepareResult.error,
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
                return {
                    success: false,
                    error: executeResult.errorMessage || "Failed to execute transaction",
                    originalError: executeResult.error,
                    step: "execute_transaction",
                }
            }

            console.log("Transaction executed successfully")

            console.log("Complete deposit flow finished successfully")
            return {
                success: true,
                depositId,
                preparedData: prepareResult.preparedData,
                executionResult: executeResult.result,
            }
        } catch (error: any) {
            console.error("Error in transaction preparation or execution:", error)
            return {
                success: false,
                error: extractErrorMessage(error) || "Error processing transaction",
                originalError: error,
                step: "prepare_transaction",
            }
        }
    } catch (error: any) {
        console.error("Error in complete deposit flow:", error)
        if (error.response) {
            console.error("Error response data:", error.response.data)
        }
        return {
            success: false,
            error: extractErrorMessage(error) || "Unknown error",
            originalError: error,
            step: "complete_flow",
        }
    }
}
