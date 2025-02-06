"use client";
import dynamic from "next/dynamic";
// Dynamic import with no SSR
const TokenTransfer = dynamic(
  () =>
    import("@/components/auth/token-transfer").then((mod) => mod.TokenTransfer),
  { ssr: false }
);

// Usage in your component
export default function MyPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Stacks App</h1>
      <TokenTransfer
        network="mainnet"
        amount={100_000_000}
        recipient="SP1M8KHCJXB3SBRQRDBCG3J3859AA1CN0AWDHN17B"
        contractAddress="SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46"
        contractName="shortdao-faktory"
        token="SHORTDAO"
        buttonText="Transfer SHORTDAO"
        onSuccess={() => console.log("Transfer successful")}
        onError={(error) => console.error("Transfer failed:", error)}
      />
    </div>
  );
}
