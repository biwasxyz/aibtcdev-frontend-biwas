import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for copying text to clipboard
 */
export function useClipboard() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000);

      return true;
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    copiedText,
    copyToClipboard,
  };
}
