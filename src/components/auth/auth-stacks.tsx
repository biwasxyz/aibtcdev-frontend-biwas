"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import { connectWallet, requestSignature } from "./stacks-provider";

// Dynamically import StacksProvider component
const StacksProvider = dynamic(() => import("./stacks-provider"), {
  ssr: false,
});

export default function StacksAuth() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userData, setUserData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAuthentication = async (
    stxAddress: string,
    signature: string
  ) => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${stxAddress}@stacks.id`,
        password: signature,
      });

      if (signInError && signInError.status === 400) {
        toast({
          description: "Creating your account...",
        });

        const { error: signUpError } = await supabase.auth.signUp({
          email: `${stxAddress}@stacks.id`,
          password: signature,
        });

        if (signUpError) throw signUpError;

        toast({
          description: "Successfully signed up...",
          variant: "default",
        });

        return true;
      } else if (signInError) {
        throw signInError;
      }

      toast({
        description: "connection succesfull...",
        variant: "default",
      });

      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        description: "Authentication failed. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      toast({
        description: "Connecting wallet...",
      });

      const data = await connectWallet({
        onCancel: () => {
          toast({
            description: "Wallet connection cancelled.",
          });
          setIsLoading(false);
        },
      });

      setUserData(data);
      setShowTerms(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        description: "Authentication failed. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    if (!userData) return;

    setIsLoading(true);
    setShowTerms(false);

    try {
      const stxAddress = userData.profile.stxAddress.mainnet;

      // Request signature
      toast({
        description: "Please sign the message to authenticate...",
      });

      const signature = await requestSignature();

      toast({
        description: "Signature received. Authenticating...",
      });

      const success = await handleAuthentication(stxAddress, signature);

      if (success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        description: "Authentication failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!mounted) return null;

  return (
    <StacksProvider>
      <Button onClick={handleAuth} disabled={isLoading} variant="primary">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          "Connect Wallet"
        )}
      </Button>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">
              AIBTC Disclosures
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full pr-4">
            <div className="prose dark:prose-invert max-w-none space-y-8">
              <section>
                <p className="text-zinc-800 dark:text-zinc-200">
                  By using the AIBTC application (the &quot;App&quot;), you
                  agree and acknowledge the following:
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  AIBTC does not control funds or DAOs
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  AIBTC provides software to assist users in interacting with
                  blockchain networks. We do not hold user funds, issue tokens,
                  or exercise control over any DAO treasury.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Users control all Token and DAO activities
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  Users initiate and execute all token-related actions, purchase
                  seats, and launch DAOs. AIBTC does not manage or originate
                  such activities.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Users are responsible for their own funds and DAO treasuries
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  Users are responsible for their own secret keys and control of
                  their own funds. DAO treasury funds are managed via the
                  governance mechanism of each DAO.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Users must comply with applicable laws
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  By using the App, users agree to comply with all applicable
                  laws and regulations, including those governing DAO
                  activities. AIBTC does not guarantee legal compliance of DAOs
                  launched on the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Users and DAO members should consult advisors
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  Any documents, examples, or demos provided by AIBTC serve only
                  illustrative purposes and should not be considered financial,
                  legal, or tax advice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Blockchain transactions are final and irreversible
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  All blockchain transactions are irreversible and without
                  refunds. Users bear sole responsibility for evaluating
                  transactions before executing them.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  AIBTC is not responsible for indirect, incidental, or
                  consequential damages
                </h2>
                <p className="text-zinc-800 dark:text-zinc-200">
                  Under no circumstances shall AIBTC be liable for indirect,
                  incidental, or consequential damages, including lost profits,
                  even if advised of such possibilities.
                </p>
              </section>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-6">
            <Button onClick={handleAcceptTerms} size="lg">
              Accept & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StacksProvider>
  );
}
