"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DAOBuyModal } from "@/components/daos/DaoBuyModalUpdated";

interface DAOBuyTokenProps {
  daoId: string;
}

export function DAOBuyToken({ daoId }: DAOBuyTokenProps) {
  const [presetAmount, setPresetAmount] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuickBuy = (amount: string) => {
    setPresetAmount(amount);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        variant="primary"
        className="flex-1"
        onClick={() => handleQuickBuy("20000")}
      >
        20k Sats
      </Button>
      <DAOBuyModal
        daoId={daoId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        presetAmount={presetAmount}
      />
    </div>
  );
}
