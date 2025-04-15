"use client";

import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import AuthButton from "@/components/home/auth-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-zinc-800 p-3 rounded-full w-fit mb-4">
            <LockKeyhole className="h-6 w-6 text-zinc-300" />
          </div>
          <DialogTitle className="text-center text-xl">
            Not Authenticated
          </DialogTitle>
          <DialogDescription className="text-center">
            You need to be signed in to access this page.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 mx-auto">
          <AuthButton />
        </div>
      </DialogContent>
    </Dialog>
  );
}
