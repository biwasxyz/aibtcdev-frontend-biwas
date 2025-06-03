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
        <div className="absolute top-20 left-20 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 bg-secondary/5 rounded-full blur-3xl delay-1000" />
        <div className="absolute top-60 right-40 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-primary/3 rounded-full blur-2xl delay-500" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 xl:py-20">
        <div className="space-y-6 sm:space-y-8 lg:space-y-12 xl:space-y-16">
          {/* Enhanced Hero Header Section */}
          <div className="text-center space-y-4 sm:space-y-6 lg:space-y-8 xl:space-y-10">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 rounded-xl sm:rounded-2xl lg:rounded-[1.5rem] xl:rounded-[2rem] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 backdrop-blur-sm mb-3 sm:mb-4 lg:mb-6 xl:mb-8 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-500 ease-out group">
              <User className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
              <Sparkles className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-secondary" />
            </div>
            
            <div className="space-y-2 sm:space-y-3 lg:space-y-4 xl:space-y-6 max-w-4xl mx-auto px-2 sm:px-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground tracking-tight leading-tight">
                Your Profile
                <span className="block text-base sm:text-lg lg:text-xl xl:text-2xl font-medium text-primary mt-1 sm:mt-2 tracking-wide">
                  Command Center
                </span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                Manage your account settings, view voting history, and configure AI agents for 
                <span className="text-primary font-medium"> automated governance participation</span>
              </p>
            </div>

            {/* Enhanced Status Badge */}
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-5 xl:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent text-primary rounded-lg sm:rounded-xl lg:rounded-2xl border border-primary/20 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse shadow-sm" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide">
                {!isClient ? "Initializing..." : stacksAddress ? "Connected & Active" : "Awaiting Connection"}
              </span>
            </div>
          </div>

          {/* Enhanced Bento Grid Layout */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8 xl:space-y-12">
            {/* Connected Account Card - Full width but constrained */}
            <div className="max-w-5xl mx-auto">
              <Card className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border-border/30 shadow-xl hover:shadow-2xl hover:border-border/60 transition-all duration-500 ease-out group overflow-hidden relative">
                {/* Card Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="pb-3 sm:pb-4 lg:pb-6 xl:pb-10 relative">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                      <Wallet className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-primary" />
                    </div>
                    <div>
                      <span className="block">Connected Account</span>
                      <span className="text-xs sm:text-sm font-normal text-muted-foreground tracking-wide">Wallet Integration</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0 relative">
                  <div className="space-y-4 sm:space-y-6 lg:space-y-8 xl:space-y-10">
                    {!isClient ? (
                      /* Enhanced Loading State */
                      <div className="text-center py-6 sm:py-8 lg:py-12 xl:py-16 space-y-3 sm:space-y-4 lg:space-y-6 xl:space-y-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-28 xl:h-28 rounded-xl sm:rounded-2xl lg:rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30">
                          <Wallet className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 xl:h-14 xl:w-14 text-muted-foreground/50 animate-pulse" />
                        </div>
                        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                          <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold text-foreground">
                            Initializing...
                          </h3>
                          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed font-light">
                            Establishing secure connection with your wallet
                          </p>
                        </div>
                      </div>
                    ) : stacksAddress ? (
                      <>
                        {/* Enhanced Account Info */}
                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                          {/* Enhanced Avatar */}
                          <div className="relative group/avatar mx-auto sm:mx-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center shadow-lg group-hover/avatar:shadow-xl group-hover/avatar:scale-105 transition-all duration-300">
                              <User className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 xl:h-10 xl:w-10 text-primary" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full border-2 border-card flex items-center justify-center shadow-sm">
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 bg-white rounded-full animate-pulse" />
                            </div>
                          </div>

                          {/* Enhanced Address Info */}
                          <div className="flex-1 min-w-0 space-y-3 sm:space-y-4 text-center sm:text-left w-full">
                            <div className="flex justify-center sm:justify-start">
                              <Badge className="bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 text-emerald-500 border-emerald-500/30 px-3 sm:px-4 py-1 sm:py-2 font-semibold tracking-wide shadow-sm text-xs sm:text-sm">
                                ● Active
                              </Badge>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                              <p className="font-mono text-xs sm:text-sm text-foreground bg-gradient-to-r from-muted/40 to-muted/20 px-3 sm:px-4 py-2 sm:py-3 rounded-lg lg:rounded-xl border border-border/30 backdrop-blur-sm shadow-sm break-all">
                                {stacksAddress}
                              </p>
                              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                                Stacks Address
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(stacksAddress)}
                            className="w-full sm:w-auto text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 transition-all duration-300 px-4 sm:px-6 py-3 sm:py-2 rounded-lg lg:rounded-xl group/button border border-transparent hover:border-border/30 shadow-sm hover:shadow-md min-h-[44px] sm:min-h-auto"
                          >
                            {copiedText === stacksAddress ? (
                              <Check className="h-4 w-4 mr-2 sm:mr-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4 mr-2 sm:mr-3 group-hover/button:scale-110 transition-transform duration-300" />
                            )}
                            <span className="font-medium text-sm sm:text-xs lg:text-sm">
                              {copiedText === stacksAddress ? "Copied!" : "Copy Address"}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="w-full sm:w-auto text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 transition-all duration-300 px-4 sm:px-6 py-3 sm:py-2 rounded-lg lg:rounded-xl group/button border border-transparent hover:border-border/30 shadow-sm hover:shadow-md min-h-[44px] sm:min-h-auto"
                          >
                            <a
                              href={getAddressExplorerUrl(stacksAddress)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2 sm:mr-3 group-hover/button:scale-110 transition-transform duration-300" />
                              <span className="font-medium text-sm sm:text-xs lg:text-sm">View Explorer</span>
                            </a>
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* Enhanced No Wallet Connected State */
                      <div className="text-center py-6 sm:py-8 lg:py-12 xl:py-16 space-y-3 sm:space-y-4 lg:space-y-6 xl:space-y-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-28 xl:h-28 rounded-xl sm:rounded-2xl lg:rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30">
                          <Wallet className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 xl:h-14 xl:w-14 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                          <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold text-foreground">
                            No Wallet Connected
                          </h3>
                          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed font-light px-4">
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
                
                <CardHeader className="pb-3 sm:pb-4 lg:pb-6 xl:pb-10 relative">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent border border-secondary/20 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-secondary" />
                    </div>
                    <div>
                      <span className="block">Agent Management</span>
                      <span className="text-xs sm:text-sm font-normal text-muted-foreground tracking-wide">AI Configuration</span>
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
