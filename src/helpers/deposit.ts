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
    amount: string // BTC amount as string
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

// Define the return type for completeDepositFlow
export interface DepositFlowResult {
    success: boolean
    depositId?: string
    preparedData?: PreparedTransactionData
    executionResult?: ExecuteTransactionResponse
    error?: string
    originalError?: any
    step?: string
    details?: any
    isInscriptionError?: boolean
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
 * Prepare a transaction with UTXOs and fee calculation
 */
export async function prepareTransaction(params: TransactionParams) {
    try {
        // Log the parameters for debugging
        console.log("Preparing transaction with params:", {
            amount: params.amount,
            userAddress: params.userAddress,
            btcAddress: params.btcAddress,
            feePriority: params.feePriority,
            walletProvider: params.walletProvider,
        })

        // Call the SDK to prepare transaction
        console.log("Calling styxSDK.prepareTransaction")
        const preparedData = await styxSDK.prepareTransaction({
            amount: params.amount,
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
            errorMessage: extractErrorMessage(error),
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

        // Return the original error
        return {
            success: false,
            error: error,
            errorMessage: extractErrorMessage(error),
        }
    }
}

/**
 * Update deposit status
 */
export async function updateDepositStatus(depositId: string, txId: string) {
    console.log("Updating deposit status for ID:", depositId, "with txId:", txId)
    try {
        const result = await styxSDK.updateDepositStatus({
            id: depositId,
            data: {
                btcTxId: txId,
                status: "broadcast",
            },
        })
        console.log("Deposit status updated:", result)
        return { success: true, result }
    } catch (error: any) {
        console.error("Error updating deposit status:", error)
        return {
            success: false,
            error: error,
            errorMessage: extractErrorMessage(error),
        }
    }
}

/**
 * Get deposit history for a user
 */
export async function getDepositHistory(userAddress: string) {
    console.log("Getting deposit history for address:", userAddress)
    try {
        const history = await styxSDK.getDepositHistory(userAddress)
        console.log("Deposit history:", history)
        return { success: true, history }
    } catch (error: any) {
        console.error("Error getting deposit history:", error)
        return {
            success: false,
            error: error,
            errorMessage: extractErrorMessage(error),
        }
    }
}

/**
 * Get all deposits history (admin function)
 */
export async function getAllDepositsHistory() {
    console.log("Getting all deposits history")
    try {
        const history = await styxSDK.getAllDepositsHistory()
        console.log("All deposits history:", history)
        return { success: true, history }
    } catch (error: any) {
        console.error("Error getting all deposits history:", error)
        return {
            success: false,
            error: error,
            errorMessage: extractErrorMessage(error),
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
 * Complete deposit flow - following the sequence:
 * 1. Prepare Transaction
 * 2. Create Deposit
 * 3. Execute Transaction
 * 4. Update Deposit Status
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
}): Promise<DepositFlowResult> {
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

        // 1. Prepare transaction
        console.log("Step 1 - Preparing transaction")
        const prepareResult = await prepareTransaction({
            amount: btcAmount.toString(), // BTC amount as string
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

        // 2. Create deposit
        console.log("Step 2 - Creating deposit")
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

        // Extract the transaction ID from the UTXO
        let txId = ""
        if (executeResult.result && executeResult.result.utxos && executeResult.result.utxos.length > 0) {
            txId = executeResult.result.utxos[0].txid
            console.log("Extracted txId from UTXO:", txId)
        }

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
        return {
            success: false,
            error: extractErrorMessage(error) || "Unknown error",
            originalError: error,
            step: "complete_flow",
        }
    }
}
