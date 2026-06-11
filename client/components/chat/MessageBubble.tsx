"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  User,
  Copy,
  RotateCcw,
  Check,
  Pencil,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import SourceCard from "./SourceCard";
import { Source } from "@/store/chat/chat.store";

interface Props {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function MessageBubble({ role, content, sources }: Props) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const normalizedContent =
    typeof content === "string" ? content : JSON.stringify(content);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(normalizedContent);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className={`group flex w-full animate-message-pop ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex max-w-[88%] gap-4 ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 ${
            isUser
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Bubble */}
          <div
            className={`relative overflow-hidden rounded-3xl border px-5 py-4 shadow-sm transition-all duration-300 ${
              isUser
                ? "rounded-tr-md border-slate-900 bg-slate-900 text-white"
                : "rounded-tl-md border-slate-200 bg-white text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            }`}
          >
            {/* User Message */}
            {isUser ? (
              <>
                <p className="whitespace-pre-wrap text-sm leading-7">
                  {normalizedContent}
                </p>

                {/* User Actions */}
                <div className="mt-3 flex items-center justify-end gap-2 opacity-100">
                  <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
                    <Pencil size={12} />
                    Edit
                  </button>

                  <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
                    <RotateCcw size={12} />
                    Retry
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Assistant Markdown */}
                <div className="prose prose-slate max-w-none text-[15px] leading-8">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...props }) => (
                        <h1
                          className="mb-4 mt-6 text-2xl font-semibold tracking-tight text-slate-900"
                          {...props}
                        />
                      ),

                      h2: ({ ...props }) => (
                        <h2
                          className="mb-3 mt-6 text-xl font-semibold tracking-tight text-slate-900"
                          {...props}
                        />
                      ),

                      h3: ({ ...props }) => (
                        <h3
                          className="mb-2 mt-5 text-lg font-semibold tracking-tight text-slate-900"
                          {...props}
                        />
                      ),

                      p: ({ ...props }) => (
                        <p
                          className="mb-4 leading-8 text-slate-700"
                          {...props}
                        />
                      ),

                      ul: ({ ...props }) => (
                        <ul
                          className="mb-4 ml-4 list-disc space-y-2 text-slate-700"
                          {...props}
                        />
                      ),

                      ol: ({ ...props }) => (
                        <ol
                          className="mb-4 ml-4 list-decimal space-y-2 text-slate-700"
                          {...props}
                        />
                      ),

                      strong: ({ ...props }) => (
                        <strong
                          className="font-semibold text-slate-900"
                          {...props}
                        />
                      ),

                      code: ({ ...props }) => (
                        <code
                          className="rounded-lg bg-slate-100 px-1.5 py-1 text-[13px]"
                          {...props}
                        />
                      ),

                      pre: ({ ...props }) => (
                        <pre
                          className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-100"
                          {...props}
                        />
                      ),

                      blockquote: ({ ...props }) => (
                        <blockquote
                          className="border-l-4 border-slate-300 pl-4 italic text-slate-500"
                          {...props}
                        />
                      ),

                      table: ({ ...props }) => (
                        <div className="my-6 overflow-hidden rounded-2xl border border-slate-200">
                          <table
                            className="w-full border-collapse text-sm"
                            {...props}
                          />
                        </div>
                      ),

                      thead: ({ ...props }) => (
                        <thead className="bg-slate-50" {...props} />
                      ),

                      th: ({ ...props }) => (
                        <th
                          className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700"
                          {...props}
                        />
                      ),

                      td: ({ ...props }) => (
                        <td
                          className="border-b border-slate-100 px-4 py-3 text-slate-600"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {normalizedContent}
                  </ReactMarkdown>
                </div>

                {/* Assistant Actions */}
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy
                      </>
                    )}
                  </button>

                  <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800">
                    <RotateCcw size={14} />
                    Regenerate
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Sources */}
          {!isUser && Array.isArray(sources) && sources.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
              {/* Header */}
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex w-full items-center justify-between px-4 py-3 transition-colors duration-300 hover:bg-stone-100"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />

                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-500">
                    Grounded Sources
                  </p>

                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                    {sources.length}
                  </span>
                </div>

                {showSources ? (
                  <ChevronDown size={16} className="text-stone-500" />
                ) : (
                  <ChevronRight size={16} className="text-stone-500" />
                )}
              </button>

              {/* Expandable Content */}
              <div
                className={`grid transition-all duration-300 ${
                  showSources ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="grid gap-3 border-t border-stone-200 p-4">
                    {sources.map((source, index) => (
                      <SourceCard key={index} source={source} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
