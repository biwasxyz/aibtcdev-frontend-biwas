import { Metadata, Viewport } from "next";
import React from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat with your AI agents",
};

export default function ChatLayout({
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
