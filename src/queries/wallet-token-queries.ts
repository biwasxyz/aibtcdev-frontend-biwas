import { supabase } from "@/utils/supabase/client";

export interface WalletToken {
  id: string; // UUID
  created_at: Date; // Timestamp with time zone
  updated_at?: Date; // Timestamp without time zone (optional)
  dao_id?: string; // UUID (optional)
  token_id?: string; // UUID (optional)
  wallet_id?: string; // UUID (optional)
  amount?: string; // Amount as text (optional)
}

// Fetch all wallet tokens
export const fetchWalletTokens = async (): Promise<WalletToken[]> => {
  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

// Fetch wallet tokens by DAO ID
export const fetchWalletTokensByDao = async (
  daoId: string,
): Promise<WalletToken[]> => {
  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .eq("dao_id", daoId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

// Fetch wallet tokens by wallet ID
export const fetchWalletTokensByWallet = async (
  walletId: string,
): Promise<WalletToken[]> => {
  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

// Fetch wallet tokens by token ID
export const fetchWalletTokensByToken = async (
  tokenId: string,
): Promise<WalletToken[]> => {
  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .eq("token_id", tokenId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

// Fetch a specific wallet token
export const fetchWalletToken = async (
  tokenId: string,
): Promise<WalletToken | null> => {
  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .eq("id", tokenId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};
