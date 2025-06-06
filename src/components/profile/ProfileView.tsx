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

function CompactStatus({ 
  isClient, 
  stacksAddress 
}: { 
  isClient: boolean;
  stacksAddress: string | null;
}) {
  const getStatusInfo = () => {
    if (!isClient) return { label: "Initializing...", color: "bg-muted/50" };
    if (stacksAddress) return { label: "Connected & Active", color: "bg-primary/20 text-primary" };
    return { label: "Awaiting Connection", color: "bg-accent/20 text-accent" };
  };

  const { label, color } = getStatusInfo();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 ${color}`}>
      <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

export function ProfileView() {
  const { copyToClipboard, copiedText } = useClipboard();
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setStacksAddress(getStacksAddress());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Compact Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account and AI agent settings
            </p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex justify-center">
          <CompactStatus isClient={isClient} stacksAddress={stacksAddress} />
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Connected Account Card */}
          <Card className="bg-card border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="block">Connected Account</span>
                  <span className="text-xs font-normal text-muted-foreground">Wallet Integration</span>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-4">
                {!isClient ? (
                  /* Loading State */
                  <div className="text-center py-6 space-y-2">
                    <div className="w-8 h-8 mx-auto rounded-lg bg-muted/20 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-muted-foreground animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        Initializing...
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Establishing secure connection with your wallet
                      </p>
                    </div>
                  </div>
                ) : stacksAddress ? (
                  <>
                    {/* Account Info */}
                    <div className="space-y-3">
                      <div className="flex justify-center sm:justify-start">
                        <Badge className="bg-primary/20 text-foreground border-primary/30 px-3 py-1 font-semibold text-xs">
                          ● Active
                        </Badge>
                      </div>
                      
                      <div className="p-3 bg-muted/10 rounded-lg border border-border/20">
                        <p className="font-mono text-xs text-foreground break-all mb-1">
                          {stacksAddress}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Stacks Address
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(stacksAddress)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedText === stacksAddress ? (
                          <Check className="h-3 w-3 mr-1 text-primary" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        <span className="text-xs">
                          {copiedText === stacksAddress ? "Copied!" : "Copy"}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <a
                          href={getAddressExplorerUrl(stacksAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          <span className="text-xs">Explorer</span>
                        </a>
                      </Button>
                    </div>
                  </>
                ) : (
                  /* No Wallet Connected State */
                  <div className="text-center py-6 space-y-2">
                    <div className="w-8 h-8 mx-auto rounded-lg bg-muted/20 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        No Wallet Connected
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Connect your Stacks wallet to access your profile
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agent Management Card */}
          <Card className="bg-card border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <span className="block">Agent Management</span>
                  <span className="text-xs font-normal text-muted-foreground">AI Configuration</span>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              <AgentPromptForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
