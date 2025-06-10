export function truncateString(
  str: string,
  startLength: number,
  endLength?: number
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
  txId: string
): string {
  const baseUrl = "https://explorer.stacks.co";
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK;
  const chainParam = network === "testnet" ? "testnet" : "mainnet";
  let path: string;
  switch (type) {
    case "tx":
      path = `/txid/${txId}`;
      break;
    case "address":
      path = `/address/${txId}`;
      break;
    case "contract":
      path = `/contract/${txId}`;
      break;
    default:
      path = "";
  }
  return `${baseUrl}${path}?chain=${chainParam}`;
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
