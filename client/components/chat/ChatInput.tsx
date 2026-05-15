"use client";

import { useState, KeyboardEvent } from "react";
import { Send, CornerDownLeft } from "lucide-react";

interface Props {
  onSend: (query: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [query, setQuery] = useState("");

  const handleSubmit = () => {
    if (!query.trim() || disabled) return;
    onSend(query);
    setQuery("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-slate-100 bg-white p-4">
      <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all duration-200">
        <textarea
          rows={1}
          placeholder="Ask financial questions "
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 leading-normal self-center"
        />

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-slate-400 font-medium tracking-wide bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
            Enter <CornerDownLeft size={8} />
          </span>
          <button
            onClick={handleSubmit}
            disabled={disabled || !query.trim()}
            className="rounded-xl bg-slate-900 p-2 text-white transition-all duration-200 hover:bg-slate-800 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
