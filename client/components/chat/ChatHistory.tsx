"use client";

import { MessageSquare, Calendar } from "lucide-react";
import { useChatStore } from "@/store/chat/chat.store";

interface Props {
  onSelectChat: (chatId: string) => void;
  activeChatId: string; // Added to resolve the TS error
}

export default function ChatHistory({ onSelectChat, activeChatId }: Props) {
  const { chats } = useChatStore();

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
          <MessageSquare size={16} className="text-slate-300" />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          No records found
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {chats.map((chat) => {
        const isActive = activeChatId === chat.id;

        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`group relative flex w-full flex-col gap-2 rounded-xl border p-3.5 text-left transition-all duration-200 ${
              isActive
                ? "border-blue-200 bg-blue-50/60 shadow-[0_2px_12px_-3px_rgba(59,130,246,0.1)]"
                : "border-transparent bg-transparent hover:bg-slate-50"
            }`}
          >
            {/* Active Side Indicator */}
            {isActive && (
              <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <MessageSquare
                  size={14}
                  className={isActive ? "text-blue-600" : "text-slate-400"}
                />
                <p
                  className={`truncate text-[13px] font-semibold transition-colors ${
                    isActive
                      ? "text-slate-900"
                      : "text-slate-600 group-hover:text-slate-900"
                  }`}
                >
                  {chat.title || "Untitled Analysis"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar size={10} className="text-slate-300" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {new Date(chat.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
