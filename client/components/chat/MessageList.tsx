"use client";
import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { useChatStore } from "@/store/chat/chat.store";
import MessageBubble from "./MessageBubble";
import TypingLoader from "./TypingLoader";
import EmptyState from "../ui/EmptyState";

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
    <div className="flex-1 overflow-y-auto bg-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        {messages.length === 0 && (
          <EmptyState
            icon={<Sparkles size={24} />}
            title="Financial Intelligence Workspace"
            description="Ask about earnings, margins, operational performance, strategic growth, capex guidance, or financial risks."
          />
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            style={{
              animationDelay: `${index * 40}ms`,
            }}
          >
            <MessageBubble
              role={message.role}
              content={message.content}
              sources={message.sources}
            />
          </div>
        ))}

        {loading && <TypingLoader />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
