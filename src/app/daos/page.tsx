import { fetchDAOs } from "@/services/dao.service";

export default async function Page() {
  await fetchDAOs();
  const AllDaos = (await import("@/components/daos/AllDaos")).default;
  return <AllDaos />;
}
