"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function TypingIndicator({ className }: { className?: string }) {
  const [dots, setDots] = useState(1);

  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "flex items-center p-4 rounded-xl bg-muted/50 w-fit max-w-[80%]",
        className
      )}
    >
      <div className="flex space-x-1 items-center">
        <div
          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
