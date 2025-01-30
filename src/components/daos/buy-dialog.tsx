import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { makeContractCall } from "@stacks/transactions";

interface BuyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (stxAmount: number, buyParams: any) => void;
  tokenSymbol: string;
  getBuyParams: (stxAmount: number) => Promise<any>;
}

export const BuyDialog = ({
  isOpen,
  onClose,
  onConfirm,
  tokenSymbol,
  getBuyParams,
}: BuyDialogProps) => {
  const [stxAmount, setStxAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    const amount = Number.parseFloat(stxAmount);
    if (!isNaN(amount) && amount > 0) {
      setIsLoading(true);
      try {
        const buyParams = await getBuyParams(amount);
        const tx = await makeContractCall(buyParams);
        onConfirm(amount, tx);
      } catch (error) {
        console.error("Error making contract call:", error);
        alert("Failed to make contract call. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please enter a valid STX amount");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy {tokenSymbol}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stx-amount" className="text-right">
              STX Amount
            </Label>
            <Input
              id="stx-amount"
              type="number"
              value={stxAmount}
              onChange={(e) => setStxAmount(e.target.value)}
              className="col-span-3"
              placeholder="Enter STX amount"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
