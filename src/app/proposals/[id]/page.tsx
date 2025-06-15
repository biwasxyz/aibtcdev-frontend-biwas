export const runtime = "edge";

import { fetchProposalById } from "@/services/dao.service";

interface PageProps {
  params: { id: string };
}

export default async function Page({ params }: PageProps) {
  // Fetch the proposal data based on the dynamic route parameter
  await fetchProposalById(params.id);
  const PageClient = (await import("./PageClient")).default;
  return <PageClient />;
}
