import { supabase } from "@/utils/supabase/client"
import { sdkFaktory } from "@/lib/faktory-fun"
import type { Extension, DAO, Holder, Token } from "@/types/supabase"


interface MarketStats {
    price: number;
    marketCap: number;
    treasuryBalance: number;
    holderCount: number;
}

interface TreasuryToken {
    type: 'FT' | 'NFT';
    name: string;
    symbol: string;
    amount: number;
    value: number;
}

interface TokenBalance {
    balance: string;
    total_sent: string;
    total_received: string;
}

interface HiroBalanceResponse {
    stx: TokenBalance;
    fungible_tokens: {
        [key: string]: TokenBalance;
    };
    non_fungible_tokens: {
        [key: string]: {
            count: number;
            total_sent: number;
            total_received: number;
        };
    };
}

interface HiroHolderResponse {
    total_supply: string;
    limit: number;
    offset: number;
    total: number;
    results: {
        address: string;
        balance: string;
    }[];
}

const STACKS_NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK

export const fetchDAO = async (id: string): Promise<DAO> => {
    const { data, error } = await supabase.from("daos").select("*").eq("id", id).single()
    if (error) throw error
    return data
}

export const fetchDAOExtensions = async (id: string): Promise<Extension[]> => {
    const { data, error } = await supabase.from("extensions").select("*").eq("dao_id", id)
    if (error) throw error
    return data
}

export const fetchToken = async (id: string): Promise<Token> => {
    const { data, error } = await supabase.from("tokens").select("*").eq("dao_id", id)
    if (error) throw error
    return data[0]
}

export const fetchHolders = async (
    contractPrincipal: string,
    tokenSymbol: string,
): Promise<{ holders: Holder[]; totalSupply: number; holderCount: number }> => {
    const response = await fetch(
        `https://api.${STACKS_NETWORK}.hiro.so/extended/v1/tokens/ft/${contractPrincipal}::${tokenSymbol}/holders`,
    )
    const data: HiroHolderResponse = await response.json()
    const holdersWithPercentage = data.results.map((holder: any) => ({
        ...holder,
        percentage: (Number(holder.balance) / Number(data.total_supply)) * 100,
    }))
    return {
        holders: holdersWithPercentage,
        totalSupply: Number(data.total_supply),
        holderCount: data.total,
    }
}

export const fetchTokenPrice = async (
    dex: string,
): Promise<{ priceUsd: number; marketCap: number; holders: number }> => {
    const { data } = await sdkFaktory.getToken(dex)
    return {
        priceUsd: data.priceUsd ? Number(data.priceUsd) : 0,
        marketCap: data.marketCap ? Number(data.marketCap) : 0,
        holders: data.holders ? Number(data.holders) : 0,
    }
}

export const fetchTreasuryTokens = async (treasuryAddress: string, tokenPrice: number): Promise<TreasuryToken[]> => {
    const response = await fetch(`https://api.${STACKS_NETWORK}.hiro.so/extended/v1/address/${treasuryAddress}/balances`)
    const data = await response.json() as HiroBalanceResponse

    const tokens: TreasuryToken[] = []

    if (data.stx && Number(data.stx.balance) > 0) {
        const amount = Number(data.stx.balance) / 1_000_000
        const value = amount * tokenPrice
        tokens.push({
            type: "FT",
            name: "Stacks",
            symbol: "STX",
            amount,
            value,
        })
    }

    for (const [assetIdentifier, tokenData] of Object.entries(data.fungible_tokens)) {
        const [, tokenInfo] = assetIdentifier.split('::');
        const amount = Number(tokenData.balance) / 1_000_000;
        const value = amount * tokenPrice;
        tokens.push({
            type: 'FT',
            name: tokenInfo || assetIdentifier,
            symbol: tokenInfo || '',
            amount,
            value
        });
        // console.log('FT token processed:', tokenInfo, { amount, tokenPrice, value });
    }

    for (const [assetIdentifier] of Object.entries(data.non_fungible_tokens)) {
        const [, nftInfo] = assetIdentifier.split('::');
        tokens.push({
            type: 'NFT',
            name: nftInfo || assetIdentifier,
            symbol: nftInfo || '',
            amount: 1,
            value: 0
        });
    }

    return tokens
}

export const fetchMarketStats = async (
    dex: string,
    contractPrincipal: string,
    tokenSymbol: string,
    maxSupply: number,
): Promise<MarketStats> => {
    const [holdersData, tokenDetails] = await Promise.all([
        fetchHolders(contractPrincipal, tokenSymbol),
        fetchTokenPrice(dex),
    ])

    const treasuryBalance = maxSupply * 0.8 * tokenDetails.priceUsd

    return {
        price: tokenDetails.priceUsd,
        marketCap: tokenDetails.marketCap,
        treasuryBalance,
        holderCount: holdersData.holderCount || tokenDetails.holders,
    }
}

