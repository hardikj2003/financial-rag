"use client";

import { useEffect, useRef } from "react";

import { useChatStore } from "@/store/chat.store";

import MessageBubble from "./MessageBubble";
import TypingLoader from "./TypingLoader";

interface Props {
  loading: boolean;
}

export default function MessageList({ loading }: Props) {
  const { messages } = useChatStore();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            role={message.role}
            content={message.content}
          />
        ))}

        {loading && <TypingLoader />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
