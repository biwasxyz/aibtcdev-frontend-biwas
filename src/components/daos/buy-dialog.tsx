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

interface BuyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (stxAmount: number) => Promise<void>;
  tokenSymbol: string;
}

export const BuyDialog = ({
  isOpen,
  onClose,
  onConfirm,
  tokenSymbol,
}: BuyDialogProps) => {
  const [stxAmount, setStxAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(Number.parseFloat(stxAmount));
      onClose();
    } catch (error) {
      console.error("Error during purchase:", error);
    } finally {
      setIsLoading(false);
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
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!stxAmount || isLoading}>
            {isLoading ? "Processing..." : "Confirm Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
