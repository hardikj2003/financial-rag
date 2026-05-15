"use client";

import { useState } from "react"; // Added useState
import ReactMarkdown from "react-markdown";
import { Bot, User, ChevronDown } from "lucide-react"; // Added ChevronDown
import SourceCard from "./SourceCard";
import { Source } from "@/store/chat/chat.store";

interface Props {
  role: "user" | "assistant";
  content: unknown;
  sources?: Source[];
}

export default function MessageBubble({ role, content, sources }: Props) {
  const [isExpanded, setIsExpanded] = useState(false); // State for dropdown
  const isUser = role === "user";

  const normalizedContent =
    typeof content === "string"
      ? content
      : content && typeof content === "object"
        ? JSON.stringify(content, null, 2)
        : "";

  return (
    <div
      className={`flex w-full items-start gap-4 animate-message-pop ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 ${
          isUser
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-200 bg-white text-slate-700"
        }`}
      >
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      {/* Message Container */}
      <div
        className={`max-w-[82%] overflow-hidden rounded-3xl px-5 py-4 shadow-sm transition-all duration-300 ${
          isUser
            ? "rounded-tr-md bg-blue-600 text-white"
            : "rounded-tl-md border border-slate-200 bg-white text-slate-800"
        }`}
      >
        {/* Markdown Content */}
        <div
          className={`prose prose-sm max-w-none ${
            isUser ? "prose-invert" : "prose-slate"
          }`}
        >
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => (
                <p className="mb-3 leading-7 last:mb-0" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong
                  className={`font-semibold ${isUser ? "text-white" : "text-slate-900"}`}
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => (
                <ul className="my-3 list-disc space-y-1 pl-5" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="my-3 list-decimal space-y-1 pl-5" {...props} />
              ),
              code: ({ node, ...props }) => (
                <code
                  className={`rounded-md px-1.5 py-0.5 text-[13px] ${
                    isUser
                      ? "bg-white/10 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                  {...props}
                />
              ),
            }}
          >
            {normalizedContent}
          </ReactMarkdown>
        </div>

        {/* Interactive Sources Dropdown */}
        {!isUser && Array.isArray(sources) && sources.length > 0 && (
          <div className="mt-5 border-t border-slate-200 pt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full transition-colors duration-300 ${isExpanded ? "bg-emerald-500" : "bg-slate-300"}`}
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 group-hover:text-slate-700 transition-colors">
                  Retrieved Sources ({sources.length})
                </span>
              </div>

              {/* Animated Arrow Icon */}
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform duration-300 ease-in-out ${
                  isExpanded ? "rotate-180 text-slate-700" : "rotate-0"
                }`}
              />
            </button>

            {/* Collapsible Content */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isExpanded
                  ? "grid-rows-[1fr] opacity-100 mt-4"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-3 pb-2">
                  {sources.map((item, index) => (
                    <SourceCard key={`src-${index}`} source={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
