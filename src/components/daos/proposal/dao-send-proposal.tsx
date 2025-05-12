// "use client";

// import type React from "react";
// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Send } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import type { DAO, Token } from "@/types/supabase";
// import { useChatStore } from "@/store/chat";
// import { useQuery } from "@tanstack/react-query";
// import { fetchDAOExtensions } from "@/queries/dao-queries";
// import { useToast } from "@/hooks/use-toast";

// interface DAOChatButtonProps {
//   daoId: string;
//   dao?: DAO;
//   token?: Token;
//   size?: "sm" | "default";
//   className?: string;
// }

// export function DAOSendProposal({
//   daoId,
//   size = "default",
//   className,
//   ...props
// }: DAOChatButtonProps) {
//   const [inputValue, setInputValue] = useState("");
//   const { activeThreadId, sendMessage } = useChatStore();
//   const { toast } = useToast();

//   // Fetch DAO extensions
//   const { data: daoExtensions } = useQuery({
//     queryKey: ["daoExtensions", daoId],
//     queryFn: () => fetchDAOExtensions(daoId),
//     staleTime: 600000, // 10 minutes
//   });

//   const handleSendMessage = () => {
//     if (!inputValue.trim() || !activeThreadId) return;

//     // Find the relevant extensions
//     const relevantExtensions =
//       daoExtensions?.filter((ext) =>
//         [
//           "EXTENSIONS_ACTION_PROPOSALS",
//           "ACTIONS_MESSAGING_SEND_MESSAGE",
//           "TOKEN_DAO",
//         ].includes(ext.type)
//       ) || [];

//     // Format the extensions list
//     const extensionsList = relevantExtensions
//       .map((ext) => `${ext.type}: ${ext.contract_principal}`)
//       .join("\n");

//     // Append the extension types to the message without showing to user
//     const messageWithExtensions = `${inputValue}

//     ${extensionsList}
// `;

//     // Send the message with hidden extension types
//     sendMessage(activeThreadId, messageWithExtensions);

//     // Reset input
//     setInputValue("");

//     // Show toast notification after 3 seconds
//     setTimeout(() => {
//       toast({
//         title: "Success",
//         description: "Proposal sent on-chain successfully",
//         variant: "default",
//       });
//     }, 3000);
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   return (
//     <div className={`flex w-full gap-2 ${className}`}>
//       <Input
//         value={inputValue}
//         onChange={(e) => setInputValue(e.target.value)}
//         placeholder="Send on-chain message"
//         className="flex-grow"
//         onKeyDown={handleKeyDown}
//       />
//       <Button
//         variant="primary"
//         size={size}
//         onClick={handleSendMessage}
//         disabled={!inputValue.trim()}
//       >
//         <Send className="h-4 w-4" />
//       </Button>
//     </div>
//   );
// }
