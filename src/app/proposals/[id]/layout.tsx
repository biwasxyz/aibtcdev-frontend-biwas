import React from "react";
import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Proposal Details",
  description: "View detailed information about a DAO proposal",
};

export default function ProposalDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-full min-h-screen bg-background ">
      <div className="flex-1 w-full">{children}</div>
    </main>
  );
}
