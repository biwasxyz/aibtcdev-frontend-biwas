export function truncateString(
  str: string,
  startLength: number,
  endLength?: number,
): string {
  if (!str) return "";

  // If endLength is provided, show start...end format
  if (endLength !== undefined) {
    if (str.length <= startLength + endLength) return str;
    return `${str.slice(0, startLength)}...${str.slice(-endLength)}`;
  }

  // Otherwise, show start... format
  if (str.length <= startLength) return str;
  return str.slice(0, startLength) + "...";
}

export function formatAction(action: string): string {
  if (!action) return "";
  // Remove the contract name and keep only the function name
  const parts = action.split(".");
  return parts[parts.length - 1];
}

export function getExplorerLink(
  type: "tx" | "address" | "contract",
  txId: string,
): string {
  const baseUrl = "https://explorer.stacks.co";
  switch (type) {
    case "tx":
      return `${baseUrl}/txid/${txId}`;
    case "address":
      return `${baseUrl}/address/${txId}`;
    case "contract":
      return `${baseUrl}/contract/${txId}`;
    default:
      return baseUrl;
  }
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
