"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, Boxes, Menu, X, FileText, Vote } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { ThreadList } from "@/components/threads/thread-list";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { supabase } from "@/utils/supabase/client";
import { NetworkIndicator } from "@/components/reusables/NetworkIndicator";
// import { getStacksAddress } from "@/lib/address";
import AuthButton from "@/components/home/AuthButton";
import { AuthModal } from "@/components/auth/AuthModal";

interface ApplicationLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { id: "daos", name: "DAOs", href: "/daos", icon: Boxes },
  { id: "proposals", name: "Proposals", href: "/proposals", icon: FileText },
  // { id: "chat", name: "Chat", href: "/chat", icon: MessageSquare },
  // { id: "agents", name: "Agents", href: "/agents", icon: Users },
  { id: "votes", name: "Votes", href: "/votes", icon: Vote },
  { id: "profile", name: "Profile", href: "/profile", icon: Users },
];

export default function ApplicationLayout({
  children,
}: ApplicationLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [leftPanelOpen, setLeftPanelOpen] = React.useState(false);
  const [hasUser, setHasUser] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  // const [stacksAddress, setStacksAddress] = React.useState<string | null>(null);

  React.useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setHasUser(!!user);

      // If we're on a protected page and not authenticated, show the modal
      if ((pathname === "/profile" || pathname === "/votes") && !user) {
        setShowAuthModal(true);
      } else if ((pathname === "/profile" || pathname === "/votes") && user) {
        // If we're on a protected page and authenticated, make sure modal is closed
        setShowAuthModal(false);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthenticated = !!session?.user;
      setHasUser(isAuthenticated);

      // Close the auth modal when user becomes authenticated
      if (isAuthenticated) {
        setShowAuthModal(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    window.location.reload();
  };

  // Handle navigation to protected routes
  const handleNavigation = async (href: string, e: React.MouseEvent) => {
    // Only intercept navigation to protected pages (profile and votes)
    if (href === "/profile" || href === "/votes") {
      e.preventDefault();

      // Check if user is authenticated
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        // Show auth modal if not authenticated
        setShowAuthModal(true);
      } else {
        // Navigate to the page if authenticated
        router.push(href);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1A1A1A]">
      {/* Mobile Header */}
      <div className="md:hidden h-14 px-2 flex items-center justify-between bg-[#2A2A2A] border-b border-zinc-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
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
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="text-sm font-medium"
            >
              Sign out
            </Button>
          ) : (
            <AuthButton />
          )}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex h-16  items-center px-6 border-b border-zinc-800">
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
                  onClick={(e) => handleNavigation(item.href, e)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-base font-medium rounded-lg transition-colors",
                    isActive
                      ? "text-white bg-zinc-800/50"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="w-1/4 flex justify-end items-center gap-4">
          <NetworkIndicator />
          {hasUser ? (
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="text-sm font-medium"
            >
              Sign out
            </Button>
          ) : (
            <AuthButton />
          )}
        </div>
      </div>

      {/* Main Content */}
      {/* <AssetTracker /> */}
      <div className="flex-1 flex min-w-0 max-h-[calc(100vh-3.5rem)] md:max-h-[calc(100vh-4rem)] overflow-hidden">
        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "md:hidden fixed inset-y-0 left-0 z-50",
            "w-[min(100vw,320px)]",
            "transition-transform duration-200 ease-in-out",
            leftPanelOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Mobile Sidebar Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800">
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
              className="text-zinc-400 h-8 w-8 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Sidebar Content */}
          <div className="flex flex-col h-[calc(100vh-3.5rem)]">
            {/* Navigation */}
            <nav className="flex-shrink-0">
              <div className="p-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={(e) => {
                        handleNavigation(item.href, e);
                        setLeftPanelOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-zinc-800/50 text-white"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white",
                      )}
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

        <main className="flex-1 min-w-0 bg-background">
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
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectUrl={pathname === "/votes" ? "/votes" : "/profile"}
      />
    </div>
  );
}
