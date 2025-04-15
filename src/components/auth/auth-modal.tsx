"use client";
// import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import AuthButton from "@/components/home/auth-button";
// import { Button } from "../ui/button";

export function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Not Authenticated</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Auth Button */}
        <div className="mb-6">
          <AuthButton />
        </div>
      </div>
    </div>
  );
}
