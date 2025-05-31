export const getAddressExplorerUrl = (address: string) => {
  const network =
    process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
      ? "testnet"
      : "mainnet";
  return `https://explorer.hiro.so/address/${address}?chain=${network}`;
};
