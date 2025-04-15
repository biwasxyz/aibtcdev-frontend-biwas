"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, Boxes, Menu, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { ThreadList } from "@/components/threads/thread-list";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { supabase } from "@/utils/supabase/client";
import { NetworkIndicator } from "@/components/reusables/network-indicator";
// import { getStacksAddress } from "@/lib/address";
import AuthButton from "@/components/home/auth-button";
import AssetTracker from "@/components/reusables/asset-tracker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ApplicationLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { id: "daos", name: "DAOs", href: "/daos", icon: Boxes },
  // { id: "chat", name: "Chat", href: "/chat", icon: MessageSquare },
  // { id: "agents", name: "Agents", href: "/agents", icon: Users },
  { id: "profile", name: "Profile", href: "/profile", icon: Users },
];

// function truncateAddress(address: string | null) {
//   if (!address) return "";
//   return `${address.slice(0, 6)}...${address.slice(-4)}`;
// }

export default function ApplicationLayout({
  children,
}: ApplicationLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [leftPanelOpen, setLeftPanelOpen] = React.useState(false);
  const [hasUser, setHasUser] = React.useState(false);
  // const [stacksAddress, setStacksAddress] = React.useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

  React.useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setHasUser(!!user);

      // Get Stacks address
      // const address = getStacksAddress();
      // setStacksAddress(address);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasUser(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (pathname === "/profile" && !hasUser) {
      setIsAuthModalOpen(true);
    } else {
      setIsAuthModalOpen(false);
    }
  }, [pathname, hasUser]);

  const closeModalAndRedirect = () => {
    setIsAuthModalOpen(false);
    if (pathname === "/profile") {
      router.push("/daos");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthModalOpen(false);
    router.push("/");
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Mobile Header */}
      <div className="md:hidden h-14 px-2 flex items-center justify-between bg-zinc-900">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="text-zinc-400"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/daos" className="flex items-center gap-2">
          <Image
            src="/logos/aibtcdev-avatar-1000px.png"
            alt="AIBTCDEV"
            width={20}
            height={20}
          />
          <Image
            src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
            alt="AIBTCDEV"
            width={150}
            height={300}
          />
        </Link>
        <div className="flex items-center gap-2">
          {hasUser ? (
            <Button onClick={handleSignOut}> Sign out</Button>
          ) : (
            <AuthButton />
          )}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex h-16 bg-zinc-900 items-center px-6">
        <div className="w-1/4">
          <Link href="/daos" className="flex items-center gap-2">
            <Image
              src="/logos/aibtcdev-avatar-1000px.png"
              alt="AIBTCDEV"
              width={24}
              height={24}
            />
            <Image
              src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
              alt="AIBTCDEV"
              width={150}
              height={300}
            />
          </Link>
        </div>
        <nav className="flex-1 flex justify-center">
          <div className="flex space-x-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-base font-medium rounded-lg transition-colors",
                    isActive
                      ? "text-white"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                  )}
                >
                  {/* <item.icon className="h-5 w-5" /> */}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="w-1/4 flex justify-end items-center gap-4">
          <NetworkIndicator />
          {hasUser ? (
            <Button onClick={handleSignOut} variant="outline">
              {" "}
              Sign out
            </Button>
          ) : (
            <AuthButton />
          )}
        </div>
      </div>

      {/* Main Content */}
      <AssetTracker />
      <div className="flex-1 flex min-w-0 max-h-[calc(100vh-3.5rem)] md:max-h-[calc(100vh-4rem)] overflow-hidden">
        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "md:hidden fixed inset-y-0 left-0 z-50",
            "bg-zinc-900 w-[min(100vw,320px)]",
            "transition-transform duration-200 ease-in-out",
            leftPanelOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Mobile Sidebar Header */}
          <div className="h-14 px-4 flex items-center justify-between">
            <Link href="/daos" className="flex items-center gap-2">
              <Image
                src="/logos/aibtcdev-avatar-1000px.png"
                alt="AIBTCDEV"
                width={24}
                height={24}
                className="flex-shrink-0"
              />
              <Image
                src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
                alt="AIBTCDEV"
                width={150}
                height={300}
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftPanelOpen(false)}
              className="text-zinc-400 h-8 w-8 hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Sidebar Content */}
          <div className="flex flex-col h-[calc(100vh-3.5rem)]">
            {/* Thread List */}
            {/* <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <ThreadList setLeftPanelOpen={setLeftPanelOpen} />
              </ScrollArea>
            </div> */}

            {/* Navigation */}
            <nav className="flex-shrink-0">
              <div className="p-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-zinc-800/50 text-white"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                      )}
                      onClick={() => setLeftPanelOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0 relative">
          <ScrollArea className="h-full w-full">{children}</ScrollArea>
        </main>

        {/* Mobile Overlay */}
        {leftPanelOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/80 z-10"
            onClick={() => setLeftPanelOpen(false)}
          />
        )}
      </div>

      {/* Authentication Modal */}
      <Dialog
        open={isAuthModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeModalAndRedirect();
          }
          setIsAuthModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              Please connect your wallet or sign in to access your profile page.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-4 flex justify-center">
            <AuthButton />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModalAndRedirect}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
