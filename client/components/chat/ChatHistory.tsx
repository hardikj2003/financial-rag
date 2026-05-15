"use client";

import { MessageSquare } from "lucide-react";
import { useChatStore } from "@/store/chat/chat.store";

interface Props {
  onSelectChat: (chatId: string) => void;
}

export default function ChatHistory({ onSelectChat }: Props) {
  const { chats, activeChatId } = useChatStore();

  return (
    <div className="flex flex-col gap-2">
      {chats.map((chat) => (
        <button
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
            activeChatId === chat.id
              ? "border-blue-200 bg-blue-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
            <MessageSquare size={14} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {chat.title}
            </p>

            <p className="text-[11px] text-slate-400">
              {new Date(chat.createdAt).toLocaleDateString()}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
