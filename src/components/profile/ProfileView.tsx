"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Copy,
  Check,
  User,
  Settings,
  Wallet,
  Sparkles,
} from "lucide-react";
import { getStacksAddress } from "@/lib/address";
import { AgentPromptForm } from "@/components/profile/AgentPromptForm";
import { useClipboard } from "@/helpers/clipboard-utils";
import { getAddressExplorerUrl } from "@/helpers/explorer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function ProfileView() {
  const { copyToClipboard, copiedText } = useClipboard();
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setStacksAddress(getStacksAddress());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-secondary/5 rounded-full blur-3xl delay-1000" />
        <div className="absolute top-60 right-40 w-32 h-32 bg-primary/3 rounded-full blur-2xl delay-500" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="space-y-16">
          {/* Enhanced Hero Header Section */}
          <div className="text-center space-y-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 backdrop-blur-sm mb-8 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-500 ease-out group">
              <User className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
              <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-secondary" />
            </div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold text-foreground tracking-tight leading-tight">
                Your Profile
                <span className="block text-2xl font-medium text-primary mt-2 tracking-wide">
                  Command Center
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                Manage your account settings, view voting history, and configure AI agents for 
                <span className="text-primary font-medium"> automated governance participation</span>
              </p>
            </div>

            {/* Enhanced Status Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent text-primary rounded-2xl border border-primary/20 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse shadow-sm" />
              <span className="text-sm font-semibold tracking-wide">
                {!isClient ? "Initializing..." : stacksAddress ? "Connected & Active" : "Awaiting Connection"}
              </span>
            </div>
          </div>

          {/* Enhanced Bento Grid Layout */}
          <div className="space-y-12">
            {/* Connected Account Card - Full width but constrained */}
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border-border/30 shadow-xl hover:shadow-2xl hover:border-border/60 transition-all duration-500 ease-out group overflow-hidden relative">
                {/* Card Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="pb-10 relative">
                  <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                      <Wallet className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <span className="block">Connected Account</span>
                      <span className="text-sm font-normal text-muted-foreground tracking-wide">Wallet Integration</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0 relative">
                  <div className="space-y-10">
                    {!isClient ? (
                      /* Enhanced Loading State */
                      <div className="text-center py-16 space-y-8">
                        <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30">
                          <Wallet className="h-14 w-14 text-muted-foreground/50 animate-pulse" />
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-2xl font-semibold text-foreground">
                            Initializing...
                          </h3>
                          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed font-light">
                            Establishing secure connection with your wallet
                          </p>
                        </div>
                      </div>
                    ) : stacksAddress ? (
                      <>
                        {/* Enhanced Account Info */}
                        <div className="flex items-start gap-6">
                          {/* Enhanced Avatar */}
                          <div className="relative group/avatar">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center shadow-lg group-hover/avatar:shadow-xl group-hover/avatar:scale-105 transition-all duration-300">
                              <User className="h-10 w-10 text-primary" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full border-2 border-card flex items-center justify-center shadow-sm">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            </div>
                          </div>

                          {/* Enhanced Address Info */}
                          <div className="flex-1 min-w-0 space-y-4">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 text-emerald-500 border-emerald-500/30 px-4 py-2 font-semibold tracking-wide shadow-sm">
                                ● Active
                              </Badge>
                            </div>
                            <div className="space-y-3">
                              <p className="font-mono text-sm text-foreground bg-gradient-to-r from-muted/40 to-muted/20 px-4 py-3 rounded-xl border border-border/30 backdrop-blur-sm shadow-sm break-all">
                                {stacksAddress}
                              </p>
                              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                                Stacks Address
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Action Buttons */}
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(stacksAddress)}
                            className="text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 transition-all duration-300 px-6 py-3 rounded-xl group/button border border-transparent hover:border-border/30 shadow-sm hover:shadow-md"
                          >
                            {copiedText === stacksAddress ? (
                              <Check className="h-4 w-4 mr-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4 mr-3 group-hover/button:scale-110 transition-transform duration-300" />
                            )}
                            <span className="font-medium">
                              {copiedText === stacksAddress ? "Copied!" : "Copy Address"}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 transition-all duration-300 px-6 py-3 rounded-xl group/button border border-transparent hover:border-border/30 shadow-sm hover:shadow-md"
                          >
                            <a
                              href={getAddressExplorerUrl(stacksAddress)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-3 group-hover/button:scale-110 transition-transform duration-300" />
                              <span className="font-medium">View Explorer</span>
                            </a>
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* Enhanced No Wallet Connected State */
                      <div className="text-center py-16 space-y-8">
                        <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30">
                          <Wallet className="h-14 w-14 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-2xl font-semibold text-foreground">
                            No Wallet Connected
                          </h3>
                          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed font-light">
                            Connect your Stacks wallet to access your profile, voting history, and AI agent management features.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agent Management Card - Full width for tables */}
            <div className="w-full">
              <Card className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border-border/30 shadow-xl hover:shadow-2xl hover:border-border/60 transition-all duration-500 ease-out group overflow-hidden relative">
                {/* Card Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="pb-10 relative">
                  <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent border border-secondary/20 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                      <Settings className="h-7 w-7 text-secondary" />
                    </div>
                    <div>
                      <span className="block">Agent Management</span>
                      <span className="text-sm font-normal text-muted-foreground tracking-wide">AI Configuration</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0 relative">
                  <AgentPromptForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
