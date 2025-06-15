// Dynamically import the Home component to add a meaningful await

export const runtime = "edge";

export default async function Page() {
  const Home = (await import("@/components/home/Home")).default;
  return <Home />;
}
