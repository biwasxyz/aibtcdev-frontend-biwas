// File: src/components/MessageDisplay.tsx
"use client";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { deserializeCV, cvToString } from "@stacks/transactions";

interface MessageDisplayProps {
  message: string;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  let decodedMessage = "";
  try {
    if (!message)
      return (
        <p className="text-center text-lg">Message: No message available</p>
      );
    const hexValue = message.startsWith("0x") ? message.slice(2) : message;
    const clarityValue = deserializeCV(Buffer.from(hexValue, "hex"));
    decodedMessage = cvToString(clarityValue);
  } catch (error) {
    decodedMessage = `Unable to decode message: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
  return (
    <>
      <div className="hidden md:block p-4 text-center text-lg font-medium">
        Message: {decodedMessage}
      </div>
      <div className="block md:hidden">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="message">
            <AccordionTrigger className="py-2 text-lg font-bold text-center">
              View Message
            </AccordionTrigger>
            <AccordionContent className="p-4 text-center">
              Message: {decodedMessage}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
};

export default MessageDisplay;
