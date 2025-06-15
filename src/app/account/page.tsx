export const runtime = "edge";

import { fetchAgents } from "@/services/agent.service";

export default async function Page() {
  // Fetch agents to trigger loading state on initial render
  await fetchAgents();
  const PageClient = (await import("./PageClient")).default;
  return <PageClient />;
}
