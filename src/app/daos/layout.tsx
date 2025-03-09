import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "DAOs",
  description: "Bitcoin-backed DAOs. Fully autonomous governance.",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex-1 flex flex-col">{children}</div>;
}
