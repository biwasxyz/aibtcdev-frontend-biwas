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
      <div className="md:hidden h-16 px-4 flex items-center justify-between bg-[#121212] border-b border-zinc-800/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg h-10 w-10 p-0 transition-colors duration-150"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <Link href="/daos" className="flex items-center gap-3 flex-1 justify-center">
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
            width={120}
            height={240}
            className="h-5 w-auto"
          />
        </Link>
        <div className="w-10"></div>
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
      <div className="flex-1 flex min-w-0 max-h-[calc(100vh-4rem)] overflow-hidden">
        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "md:hidden fixed inset-y-0 left-0 z-50",
            "w-80 bg-[#121212] border-r border-zinc-800/50",
            "transition-transform duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]",
            leftPanelOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Mobile Sidebar Content */}
          <div className="flex flex-col h-full bg-[#121212]">
            {/* Close Button */}
            <div className="flex justify-end p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftPanelOpen(false)}
                className="text-zinc-400 h-10 w-10 hover:bg-zinc-800/50 hover:text-white rounded-lg transition-colors duration-150"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-6 pb-6">
              <div className="space-y-3">
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
                        "group flex items-center gap-4 px-4 py-3 text-base font-medium rounded-xl transition-all duration-150",
                        isActive
                          ? "bg-[#FF4F03] text-white shadow-sm"
                          : "text-zinc-300 hover:bg-zinc-800/50 hover:text-white",
                      )}
                    >
                      <item.icon className={cn(
                        "h-6 w-6 transition-colors duration-150",
                        isActive ? "text-white" : "text-zinc-400 group-hover:text-white"
                      )} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Mobile Sidebar Footer */}
            <div className="p-6 border-t border-zinc-800/50">
              <div className="flex flex-col gap-3">
                <NetworkIndicator />
                {hasUser ? (
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setLeftPanelOpen(false);
                    }}
                    variant="outline"
                    className="w-full justify-center text-sm font-medium border-zinc-700 text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
                  >
                    Sign out
                  </Button>
                ) : (
                  <div className="w-full">
                    <AuthButton />
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 bg-background">
          <ScrollArea className="h-full w-full">{children}</ScrollArea>
        </main>

        {/* Mobile Overlay */}
        {leftPanelOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
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
