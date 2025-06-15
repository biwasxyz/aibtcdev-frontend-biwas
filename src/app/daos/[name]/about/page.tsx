export const runtime = "edge";

import { fetchDAOByName } from "@/services/dao.service";

export default async function Page({
  params,
}: {
  params: { name: string };
}) {
  await fetchDAOByName(params.name);
  const PageClient = (await import("./PageClient")).default;
  return <PageClient />;
}
