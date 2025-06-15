export const runtime = "edge";

import { fetchDAOByName } from "@/services/dao.service";

interface PageProps {
  params: { name: string };
}

export default async function Page({ params }: PageProps) {
  await fetchDAOByName(params.name);
  const PageClient = (await import("./PageClient")).default;
  return <PageClient />;
}
