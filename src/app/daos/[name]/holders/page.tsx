export const runtime = "edge";

import PageClient from "./PageClient";

export default async function Page() {
  return <PageClient />;
}
