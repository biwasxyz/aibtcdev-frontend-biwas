"use client";
import { openContractCall, type ContractCallOptions } from "@stacks/connect";
import {
  uintCV,
  principalCV,
  noneCV,
  PostCondition,
  PostConditionMode,
} from "@stacks/transactions";
import {
  type StacksNetwork,
  STACKS_TESTNET,
  STACKS_MAINNET,
} from "@stacks/network";
import { Button } from "@/components/ui/button";
import { userSession } from "@/lib/userSession";

interface TokenTransferProps {
  network: "mainnet" | "testnet";
  amount: number;
  recipient: string;
  contractAddress: string;
  contractName: string;
  token: string;
  buttonText?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function TokenTransfer({
  network,
  amount,
  recipient,
  contractAddress,
  contractName,
  token,
  buttonText = "Transfer Tokens",
  onSuccess,
  onError,
}: TokenTransferProps) {
  const transferToken = async () => {
    const stacksNetwork: StacksNetwork =
      process.env.NEXT_PUBLIC_STACKS_NETWORK == "mainnet"
        ? STACKS_MAINNET
        : STACKS_TESTNET;

    const sender = userSession.loadUserData().profile.stxAddress[network];

    // Create FT post condition
    const ftPostCondition: PostCondition = {
      type: "ft-postcondition",
      condition: "eq",
      amount: amount,
      address: sender,
      asset: `${contractAddress}.${contractName}::${token}`,
    };

    const options: ContractCallOptions = {
      contractAddress,
      contractName,
      functionName: "transfer",
      functionArgs: [
        uintCV(amount),
        principalCV(sender),
        principalCV(recipient),
        noneCV(),
      ],
      network: stacksNetwork,
      postConditions: [ftPostCondition],
      postConditionMode: PostConditionMode.Deny,
      appDetails: {
        name: "AIBTC",
        icon: "https://bncytzyfafclmdxrwpgq.supabase.co/storage/v1/object/public/aibtcdev/aibtcdev-avatar-250px.png",
      },
    };

    try {
      await openContractCall(options);
      console.log("Transfer initiated successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error initiating transfer:", error);
      onError?.(error);
    }
  };

  return (
    <Button onClick={transferToken} className="w-full md:w-auto">
      {buttonText}
    </Button>
  );
}
