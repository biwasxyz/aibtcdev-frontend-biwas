export const runtime = "edge";

import { fetchVotes } from "@/services/vote.service";

export default async function Page() {
  await fetchVotes();
  const PageClient = (await import("./PageClient")).default;
  return <PageClient />;
}
