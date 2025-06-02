"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Copy,
  Check,
  User,
} from "lucide-react";
import { getStacksAddress } from "@/lib/address";
import { AgentPromptForm } from "@/components/profile/AgentPromptForm";
import { useClipboard } from "@/helpers/clipboard-utils";
import { getAddressExplorerUrl } from "@/helpers/explorer";
import { Badge } from "@/components/ui/badge";

const stacksAddress = getStacksAddress();

export function ProfileView() {
  const { copyToClipboard, copiedText } = useClipboard();

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <div className="space-y-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Profile</h1>
                <p className="text-muted-foreground mt-3">
                  Manage your account settings and voting history
                </p>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-4 py-2">
                Profile Dashboard
              </Badge>
            </div>
          </div>

          {/* Connected Account Card */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                <User className="h-6 w-6 text-primary" />
                Connected Account
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-6">
                {stacksAddress ? (
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0" />

                      {/* Address */}
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-foreground truncate">
                          {stacksAddress}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Stacks Address</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => copyToClipboard(stacksAddress)}
                        className="p-2.5 hover:bg-muted rounded-lg transition-colors duration-150"
                        title="Copy address"
                      >
                        {copiedText === stacksAddress ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <a
                        href={getAddressExplorerUrl(stacksAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 hover:bg-muted rounded-lg transition-colors duration-150"
                        title="View on explorer"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-6" />
                    <p className="text-muted-foreground">No wallet connected</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Connect your wallet to view your profile
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agent Management Card */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-bold text-foreground">
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
  );
}
