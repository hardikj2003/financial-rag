"use client";

import { useState } from "react";
import { SendHorizonal } from "lucide-react";
import Button from "../ui/Button";

interface Props {
  onSend: (query: string) => void;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  disabled,
}: Props) {
  const [query, setQuery] = useState("");

  const handleSend = () => {
    if (!query.trim()) return;
    onSend(query);
    setQuery("");
  };

  return (
    <div className="border-t border-slate-200 bg-white px-6 py-5">
      <div className="mx-auto flex max-w-5xl items-end gap-4">
        <div className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm transition-all duration-300 focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-md">
          <textarea
            rows={1}
            value={query}
            disabled={disabled}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about earnings, growth, margins, guidance..."
            className="max-h-45 w-full resize-none overflow-y-auto bg-transparent text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={disabled}
          className="h-14 w-14 rounded-2xl p-0"
        >
          <SendHorizonal size={18} />
        </Button>
      </div>
    </div>
  );
}
