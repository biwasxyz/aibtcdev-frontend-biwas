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
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Mobile Header */}
      <div className="md:hidden h-20 px-6 flex items-center justify-between bg-card/50 backdrop-blur-md border-b border-border/30 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl h-12 w-12 p-0 transition-all duration-300"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <Link href="/daos" className="flex items-center gap-4 flex-1 justify-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logos/aibtcdev-avatar-1000px.png"
              alt="AIBTCDEV"
              width={32}
              height={32}
              className="flex-shrink-0 rounded-lg"
            />
            <Image
              src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
              alt="AIBTCDEV"
              width={120}
              height={240}
              className="h-6 w-auto"
            />
          </div>
        </Link>
        <div className="w-12"></div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex h-20 items-center px-8 bg-card/30 backdrop-blur-md border-b border-border/30 shadow-sm">
        <div className="w-1/4">
          <Link href="/daos" className="flex items-center gap-3 group">
            <div className="flex items-center gap-3 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logos/aibtcdev-avatar-1000px.png"
                alt="AIBTCDEV"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <Image
                src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
                alt="AIBTCDEV"
                width={150}
                height={300}
                className="h-7 w-auto"
              />
            </div>
          </Link>
        </div>
        
        {/* Desktop Navigation - Centered with Modern Pill Design */}
        <nav className="flex-1 flex justify-center">
          <div className="inline-flex items-center p-2 bg-muted/30 rounded-2xl backdrop-blur-sm border border-border/20">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavigation(item.href, e)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative",
                    isActive
                      ? "text-foreground bg-background shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
        
        <div className="w-1/4 flex justify-end items-center gap-6">
          <NetworkIndicator />
          {hasUser ? (
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="text-sm font-medium border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-300"
            >
              Sign out
            </Button>
          ) : (
            <AuthButton />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 max-h-[calc(100vh-5rem)] overflow-hidden">
        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "md:hidden fixed inset-y-0 left-0 z-50",
            "w-80 bg-card/95 backdrop-blur-xl border-r border-border/50 shadow-2xl",
            "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            leftPanelOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Mobile Sidebar Content */}
          <div className="flex flex-col h-full">
            {/* Close Button */}
            <div className="flex justify-end p-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftPanelOpen(false)}
                className="text-muted-foreground h-12 w-12 hover:bg-muted/50 hover:text-foreground rounded-xl transition-all duration-300"
              >
                <X className="h-6 w-6" />
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
                        "group flex items-center gap-4 px-6 py-4 text-base font-medium rounded-xl transition-all duration-300 relative",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg scale-105"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:scale-105",
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                        isActive ? "bg-primary-foreground/20" : "group-hover:bg-muted/50"
                      )}>
                        <item.icon className={cn(
                          "h-5 w-5 transition-colors duration-300",
                          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                      </div>
                      <span className="font-medium">{item.name}</span>
                      {isActive && (
                        <div className="absolute right-4 w-2 h-2 bg-primary-foreground rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Mobile Sidebar Footer */}
            <div className="p-6 border-t border-border/30 bg-muted/20 backdrop-blur-sm">
              <div className="space-y-4">
                <NetworkIndicator />
                {hasUser ? (
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setLeftPanelOpen(false);
                    }}
                    variant="outline"
                    className="w-full justify-center text-sm font-medium border-border/50 text-muted-foreground hover:bg-muted/30 hover:text-foreground hover:border-border transition-all duration-300"
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
            className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300"
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
