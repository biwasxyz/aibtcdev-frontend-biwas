import React from "react";
import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Agents",
  description:
    "Discover and deploy AI agents for your blockchain development needs",
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[100dvh] w-full flex flex-col bg-background">
      <div className="flex-1 w-full">
        {children}
      </div>
    </main>
  );
}
