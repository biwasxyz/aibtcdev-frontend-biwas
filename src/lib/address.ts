export function getStacksAddress(): string | null {
    if (typeof window === "undefined") {
        return null
    }

    const blockstackSession = JSON.parse(localStorage.getItem("blockstack-session") || "{}")

    const address =
        process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
            ? blockstackSession.userData?.profile?.stxAddress?.mainnet
            : blockstackSession.userData?.profile?.stxAddress?.testnet

    return address || null
}

