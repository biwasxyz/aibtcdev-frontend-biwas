export const runtime = "edge";

import { fetchDAOByName } from "@/services/dao.service";

export default async function Page({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  await fetchDAOByName(name);
  const PageClient = (await import("./PageClient")).default;
  return <PageClient />;
}
