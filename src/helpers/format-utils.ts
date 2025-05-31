/**
 * Truncates an address to show only the first and last few characters
 */
export function truncateAddress(
  address: string,
  startChars = 5,
  endChars = 5,
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats a STX balance from microSTX to a human-readable format with 6 decimal places
 */
export function formatStxBalance(balance: string | number): string {
  if (!balance) return "0";
  const num = Number(balance) / 1_000_000;
  return num.toFixed(2);
}

/**
 * Formats a token balance from microunits to a human-readable format with 8 decimal places and commas
 */
export function formatTokenBalance(balance: string | number): string {
  if (!balance) return "0";
  const num = Number(balance) / 1_000_000_00;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a number with appropriate suffixes (K, M, B)
 */
export function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

/**
 * Extracts a token name from a full token identifier
 */
export function extractTokenName(fullTokenId: string): string {
  if (!fullTokenId) return "";

  // Try to extract the token name after the :: delimiter
  if (fullTokenId.includes("::")) {
    return fullTokenId.split("::")[1];
  }

  // If no :: delimiter, try to extract the token name after the last dot
  if (fullTokenId.includes(".")) {
    const parts = fullTokenId.split(".");
    const lastPart = parts[parts.length - 1];

    // If the last part contains a hyphen, extract the part after the hyphen
    if (lastPart.includes("-")) {
      return lastPart.split("-")[0];
    }

    return lastPart;
  }

  return fullTokenId;
}

/**
 * Converts satoshis to BTC
 * @param satoshis The amount in satoshis
 * @returns The amount in BTC
 */
export function satoshiToBTC(satoshis: string): string {
  if (!satoshis || isNaN(Number(satoshis))) return "0.00000000";
  return (Number(satoshis) / 100000000).toFixed(8);
}
