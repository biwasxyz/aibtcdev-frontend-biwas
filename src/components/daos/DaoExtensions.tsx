"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Assuming this is the correct path for your table components
import type { Extension } from "@/types/supabase";
import CopyButton from "@/components/proposals/CopyButton";

interface DAOExtensionsProps {
  extensions: Extension[];
}

// Function to format extension type for display
function formatExtensionType(type: string): string {
  // Replace hyphens with spaces
  return type.replace(/-/g, " ");
}

const getStatusColor = (status: Extension["status"]) => {
  switch (status) {
    case "DEPLOYED":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "pending":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    default:
      return "";
  }
};

const getExplorerUrl = (txId: string) => {
  const baseUrl = "https://explorer.hiro.so/txid";
  const isTestnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet";
  return `${baseUrl}/${txId}${isTestnet ? "?chain=testnet" : ""}`;
};

function StatusButton({
  status,
  count,
  selected,
  onClick,
}: {
  status: Extension["status"];
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={selected ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="h-8"
    >
      <span className="capitalize">{status}</span>
      <span className="ml-2 text-xs bg-primary-foreground/10 px-1.5 py-0.5 rounded-full">
        {count}
      </span>
    </Button>
  );
}

export default function DAOExtensions({ extensions }: DAOExtensionsProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<Extension["status"]>("DEPLOYED");

  const filteredExtensions = extensions.filter(
    (ext) => ext.status === selectedStatus,
  );
  const stats = {
    active: extensions.filter((e) => e.status === "DEPLOYED").length,
    pending: extensions.filter((e) => e.status === "pending").length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Extensions</h2>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your DAO&apos;s active extensions and
            capabilities
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <StatusButton
              status="DEPLOYED"
              count={stats.active}
              selected={selectedStatus === "DEPLOYED"}
              onClick={() => setSelectedStatus("DEPLOYED")}
            />
            <StatusButton
              status="pending"
              count={stats.pending}
              selected={selectedStatus === "pending"}
              onClick={() => setSelectedStatus("pending")}
            />
          </div>

          {filteredExtensions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contract Principal</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead className="text-right">Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExtensions.map((extension) => (
                    <TableRow key={extension.id}>
                      <TableCell className="font-medium capitalize">
                        {formatExtensionType(extension.type)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(
                            extension.status,
                          )} border capitalize shrink-0`}
                        >
                          {extension.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {extension.contract_principal && (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded text-ellipsis overflow-hidden whitespace-nowrap max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
                              {extension.contract_principal}
                            </code>
                            <CopyButton text={extension.contract_principal} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {extension.tx_id && (
                          <div className="flex items-center gap-1">
                            <a
                              href={getExplorerUrl(extension.tx_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary transition-colors break-all hover:underline"
                            >
                              <span className="truncate max-w-[150px] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg inline-block">
                                {extension.tx_id}
                              </span>
                            </a>
                            <CopyButton text={extension.tx_id} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Date(extension.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-400">
                No extensions found for the selected status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
