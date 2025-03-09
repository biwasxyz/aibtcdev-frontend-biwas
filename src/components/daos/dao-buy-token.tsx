import { Button } from "@/components/ui/button";
import { DAOBuyModal } from "./dao-buy-modal";

interface DAOBuyTokenProps {
  daoId: string;
}

export function DAOBuyToken({ daoId }: DAOBuyTokenProps) {
  return (
    <DAOBuyModal
      daoId={daoId}
      trigger={<Button variant="primary">Buy</Button>}
    />
  );
}
