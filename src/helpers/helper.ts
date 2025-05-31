export function truncateString(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getExplorerLink(
  txId: string,
  type: "tx" | "address" | "contract",
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
