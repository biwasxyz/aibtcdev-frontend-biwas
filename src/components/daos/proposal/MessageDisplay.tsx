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
      return <p className="p-4 text-lg">Message: No message available</p>;
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
      {/* Desktop view */}
      <div className="hidden md:block p-4 text-lg font-medium bg-zinc-800 rounded-md">
        <span className="font-bold">Message: </span>
        {decodedMessage}
      </div>

      {/* Mobile view */}
      <div className="block md:hidden">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="message">
            <AccordionTrigger className="py-2 text-lg font-bold">
              View Message
            </AccordionTrigger>
            <AccordionContent className="p-4 bg-zinc-200 rounded-md">
              <span className="font-bold">Message: </span>
              {decodedMessage}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
};

export default MessageDisplay;
