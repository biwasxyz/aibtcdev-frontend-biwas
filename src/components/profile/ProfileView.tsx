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
    <div className="w-full min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Profile</h1>
                <p className="text-gray-400 mt-1">
                  Manage your account settings and voting history
                </p>
              </div>
              <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-sm px-3 py-1">
                Profile Dashboard
              </Badge>
            </div>
          </div>

          {/* Connected Account Card */}
          <Card className="bg-[#2A2A2A] border-gray-600">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                Connected Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stacksAddress ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0" />

                      {/* Address */}
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-white truncate">
                          {stacksAddress}
                        </p>
                        <p className="text-xs text-gray-400">Stacks Address</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => copyToClipboard(stacksAddress)}
                        className="p-2 hover:bg-gray-700 rounded-md transition-colors"
                        title="Copy address"
                      >
                        {copiedText === stacksAddress ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      <a
                        href={getAddressExplorerUrl(stacksAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-700 rounded-md transition-colors"
                        title="View on explorer"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No wallet connected</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect your wallet to view your profile
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agent Management Card */}
          <Card className="bg-[#2A2A2A] border-gray-600">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">
                Agent Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AgentPromptForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
