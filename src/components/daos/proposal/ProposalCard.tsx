// File: src/components/ProposalCard.tsx
"use client";
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import StatusBadge from "./StatusBadge";
import MessageDisplay from "./MessageDisplay";
import VoteProgress from "./VoteProgress";
import LabeledField from "./LabeledField";
import TimeStatus from "./TimeStatus";
import ProposalMetrics from "./ProposalMetrics";
import BlockVisual from "./BlockVisual";
import {
  ArrowRight,
  Calendar,
  Timer,
  Layers,
  Wallet,
  User,
  Activity,
  Hash,
} from "lucide-react";
import { truncateString, formatAction, getExplorerLink } from "./helper";
import useBlockTime from "@/hooks/use-block-time";
import { Proposal } from "@/types/supabase";

const ProposalCard: React.FC<{ proposal: Proposal }> = ({ proposal }) => {
  // Compute end time using the custom hook with fallback from the start block.
  const proposalEndTime = useBlockTime(proposal.end_block, {
    referenceTime: useBlockTime(proposal.start_block) || new Date(),
    referenceBlock: proposal.start_block,
  });

  return (
    <Card className="transition-all duration-200 hover:shadow-md overflow-hidden">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{proposal.title}</h3>
              <StatusBadge status={proposal.status} />
            </div>
            <p className="text-sm">
              {proposal.description || "No description available"}
            </p>
            <TimeStatus
              createdAt={proposal.created_at}
              concludedBy={proposal.concluded_by}
              status={proposal.status}
              start_block={proposal.start_block}
              end_block={proposal.end_block}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-1">
        {proposal.parameters && (
          <MessageDisplay message={proposal.parameters} />
        )}
        <VoteProgress
          votesFor={proposal.votes_for}
          votesAgainst={proposal.votes_against}
        />
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="space-y-1 mb-4 lg:mb-0">
            <h4 className="font-medium text-sm mb-2">Timing & Blocks</h4>
            <LabeledField
              icon={Calendar}
              label="Created"
              value={format(
                new Date(proposal.created_at),
                "MMM d, yyyy 'at' h:mm a"
              )}
            />
            <LabeledField
              icon={Timer}
              label="Ends"
              value={
                proposalEndTime
                  ? format(proposalEndTime, "MMM d, yyyy 'at' h:mm a")
                  : "Loading..."
              }
            />
            <LabeledField
              icon={Layers}
              label="Snapshot block"
              value={
                <BlockVisual value={proposal.created_at_block} type="stacks" />
              }
            />
            <LabeledField
              icon={ArrowRight}
              label="Start block"
              value={
                <BlockVisual value={proposal.start_block} type="bitcoin" />
              }
            />
            <LabeledField
              icon={Timer}
              label="End block"
              value={<BlockVisual value={proposal.end_block} type="bitcoin" />}
            />
            <LabeledField
              icon={Wallet}
              label="Liquid Tokens"
              value={
                proposal.liquid_tokens !== null
                  ? (proposal.liquid_tokens / 1e8).toFixed(2)
                  : "No data available"
              }
            />
          </div>
          <div className="space-y-1">
            {/* For mobile, you might wrap blockchain details in an Accordion */}
            <div className="hidden lg:block space-y-1">
              <h4 className="font-medium text-sm mb-2">Blockchain Details</h4>
              <LabeledField
                icon={User}
                label="Creator"
                value={truncateString(proposal.creator, 8, 8)}
                link={getExplorerLink("address", proposal.creator)}
              />
              <LabeledField
                icon={Activity}
                label="Action"
                value={formatAction(proposal.action)}
                link={
                  proposal.action
                    ? getExplorerLink("contract", proposal.action)
                    : undefined
                }
              />
              <LabeledField
                icon={Hash}
                label="Transaction ID"
                value={truncateString(proposal.tx_id, 8, 8)}
                link={getExplorerLink("tx", proposal.tx_id)}
              />
              <LabeledField
                icon={Wallet}
                label="Principal"
                value={formatAction(proposal.contract_principal)}
                link={getExplorerLink("contract", proposal.contract_principal)}
              />
            </div>
          </div>
        </div>
        <ProposalMetrics proposal={proposal} />
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
