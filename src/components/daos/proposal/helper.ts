export const truncateString = (
    str: string,
    startLength: number,
    endLength: number
) => {
    if (!str) return "No data available";
    if (str.length <= startLength + endLength) return str;
    return `${str.slice(0, startLength)}...${str.slice(-endLength)}`;
};

export const formatAction = (action: string) => {
    if (!action) return "No data available";
    const parts = action.split(".");
    return parts.length <= 1 ? action.toUpperCase() : parts[parts.length - 1].toUpperCase();
};

export const getExplorerLink = (type: string, value: string) => {
    const isTestnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet";
    const testnetParam = isTestnet ? "?chain=testnet" : "";
    switch (type) {
        case "tx":
            return `http://explorer.hiro.so/txid/${value}${testnetParam}`;
        case "address":
            return `http://explorer.hiro.so/address/${value}${testnetParam}`;
        case "contract":
            return `http://explorer.hiro.so/txid/${value}${testnetParam}`;
        default:
            return "";
    }
};
