export const runtime = "edge";

import { fetchProposalById } from "@/services/dao.service";

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  // Fetch the proposal data based on the dynamic route parameter
  await fetchProposalById(params.id);
  const PageClient = (await import("./PageClient")).default;
  return <PageClient />;
}
