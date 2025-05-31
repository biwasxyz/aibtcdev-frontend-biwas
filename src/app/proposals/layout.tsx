import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "All Proposals",
  description: "View all DAO proposals across all organizations in one place.",
};

export default function ProposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex-1 flex flex-col">{children}</div>;
}
