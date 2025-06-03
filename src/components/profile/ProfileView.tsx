"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Copy,
  Check,
  User,
  Settings,
  Wallet,
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="space-y-12">
          {/* Hero Header Section */}
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                Your Profile
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Manage your account settings, view voting history, and configure AI agents for automated governance participation
              </p>
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-2xl border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">
                {!isClient ? "Checking Connection..." : stacksAddress ? "Wallet Connected" : "Wallet Not Connected"}
              </span>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Connected Account Card */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm hover:border-border/80 transition-all duration-300">
              <CardHeader className="pb-8">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  Connected Account
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-8">
                  {!isClient ? (
                    /* Loading State */
                    <div className="text-center py-12 space-y-6">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-muted/50">
                        <Wallet className="h-12 w-12 text-muted-foreground/50 animate-pulse" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-medium text-foreground">
                          Loading...
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                          Checking wallet connection status.
                        </p>
                      </div>
                    </div>
                  ) : stacksAddress ? (
                    <>
                      {/* Account Info */}
                      <div className="flex items-center gap-4">
                        {/* Enhanced Avatar */}
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <User className="h-8 w-8 text-primary" />
                          </div>
                        </div>

                        {/* Address Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/50 px-3 py-1">
                              Active
                            </Badge>
                          </div>
                          <p className="font-mono text-sm text-foreground bg-muted/30 px-3 py-2 rounded-xl border border-border/30">
                            {stacksAddress}
                          </p>
                          <p className="text-xs text-muted-foreground">Stacks Address</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(stacksAddress)}
                          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 px-4 py-2 rounded-xl group/button"
                        >
                          {copiedText === stacksAddress ? (
                            <Check className="h-4 w-4 mr-2 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2 group-hover/button:scale-110 transition-transform duration-300" />
                          )}
                          {copiedText === stacksAddress ? "Copied!" : "Copy Address"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 px-4 py-2 rounded-xl group/button"
                        >
                          <a
                            href={getAddressExplorerUrl(stacksAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2 group-hover/button:scale-110 transition-transform duration-300" />
                            View Explorer
                          </a>
                        </Button>
                      </div>
                    </>
                  ) : (
                    /* No Wallet Connected State */
                    <div className="text-center py-12 space-y-6">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-muted/50">
                        <Wallet className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-medium text-foreground">
                          No Wallet Connected
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                          Connect your Stacks wallet to access your profile, voting history, and AI agent management features.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Agent Management Card */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm hover:border-border/80 transition-all duration-300">
              <CardHeader className="pb-8">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-secondary" />
                  </div>
                  Agent Management
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <AgentPromptForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
