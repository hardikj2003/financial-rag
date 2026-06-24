"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Menu, AlertCircle, X } from "lucide-react";

import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

import { streamMessage } from "@/services/chat/chat.service";
import { useChatStore } from "@/store/chat/chat.store";

export default function ChatContainer() {
  const { getToken } = useAuth();

  const { activeChatId, addMessage, updateLastMessage, updateLastMessageSources } =
    useChatStore();

  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || !activeChatId) {
      return;
    }
    setError(null);

    const token = await getToken();
    if (!token) {
      setError("Your session expired. Please sign in again.");
      return;
    }

    addMessage({ role: "user", content: query });
    setLoading(true);

    try {
      let started = false;
      await streamMessage(
        token,
        query,
        activeChatId,
        (streamToken: string) => {
          if (!started) {
            addMessage({ role: "assistant", content: streamToken });
            started = true;
          } else {
            updateLastMessage(streamToken);
          }
        },
        (sources) => {
          updateLastMessageSources(sources);
        },
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong generating a response. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-slate-900">
            Finance<span className="text-blue-600">RAG</span>
          </span>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700"
          >
            <span className="flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="rounded-md p-1 text-red-500 transition-colors hover:bg-red-100"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <MessageList loading={loading} onSuggestion={handleSendMessage} />
        <ChatInput onSend={handleSendMessage} disabled={loading} />
      </main>
    </div>
  );
}
