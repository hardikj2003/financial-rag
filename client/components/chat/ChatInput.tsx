"use client";

import { useState } from "react";

import { Send } from "lucide-react";

interface Props {
  onSend: (query: string) => void;

  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [query, setQuery] = useState("");

  const handleSubmit = () => {
    if (!query.trim()) return;

    onSend(query);

    setQuery("");
  };

  return (
    <div className="border-t border-slate-800 bg-slate-950 p-4">
      <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
        <textarea
          rows={1}
          placeholder="Ask financial questions..."
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-slate-500"
        />

        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="rounded-xl bg-blue-600 p-2 transition hover:bg-blue-500"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
