export const runtime = "edge";

import { fetchAllProposals } from "@/services/dao.service";

export default async function Page() {
  // Pre-fetch proposals so loading.tsx is shown while awaiting data
  await fetchAllProposals();
  const PageClient = (await import("./PageClient")).default;
  return <PageClient />;
}
