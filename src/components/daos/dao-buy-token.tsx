import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { DAOBuyModal } from "./dao-buy-modal";

interface DAOBuyTokenProps {
  daoId: string;
}

export function DAOBuyToken({ daoId }: DAOBuyTokenProps) {
  return (
    <DAOBuyModal
      daoId={daoId}
      trigger={
        <Button variant="primary" size="sm" className="gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="text-xs">Buy</span>
        </Button>
      }
    />
  );
}
