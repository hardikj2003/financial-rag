"use client";
import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { useChatStore } from "@/store/chat/chat.store";
import MessageBubble from "./MessageBubble";
import TypingLoader from "./TypingLoader";
import EmptyState from "../ui/EmptyState";

interface Props {
  loading: boolean;
  onSuggestion?: (suggestion: string) => void;
}

const SUGGESTIONS = [
  "Summarize Reliance earnings",
  "Analyze Jio growth strategy",
  "Compare operating margins",
  "Explain capital expenditure plans",
];

export default function MessageList({ loading, onSuggestion }: Props) {
  const { messages } = useChatStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll the message container directly instead of scrollIntoView, which
    // also scrolls the document and pushes the page header off-screen.
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        {messages.length === 0 && (
          <EmptyState
            icon={<Sparkles size={24} />}
            title="Financial Intelligence Workspace"
            description="Ask about earnings, margins, operational performance, strategic growth, capex guidance, or financial risks."
            suggestions={SUGGESTIONS}
            onSuggestionClick={onSuggestion}
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
      </div>
    </div>
  );
}
