export const runtime = "edge";

import { fetchProposalById } from "@/services/dao.service";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Fetch the proposal data based on the dynamic route parameter
  await fetchProposalById(id);
  const PageClient = (await import("./PageClient")).default;
  return <PageClient />;
}
