export const runtime = "edge";

export default async function Page() {
  const BitcoinDeposit = (await import("@/components/btc-deposit")).default;
  return (
    <div>
      <BitcoinDeposit />
    </div>
  );
}
