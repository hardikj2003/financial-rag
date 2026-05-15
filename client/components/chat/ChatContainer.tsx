"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { streamMessage } from "@/services/chat/chat.service";
import { useChatStore } from "@/store/chat/chat.store";

export default function ChatContainer() {
  const {
    activeChatId,
    setActiveChat,
    addMessage,
    updateLastMessage,
    updateLastMessageSources,
  } = useChatStore();

  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || !activeChatId) return;

    addMessage({
      role: "user",
      content: query,
    });

    addMessage({
      role: "assistant",
      content: "",
    });

    setLoading(true);

    try {
      await streamMessage(
        query,
        activeChatId,

        (token) => {
          updateLastMessage(token);
        },

        (sources) => {
          updateLastMessageSources(sources);
        },
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <main className="flex flex-1 flex-col">
        <MessageList loading={loading} />
        <ChatInput onSend={handleSendMessage} disabled={loading} />
      </main>
    </div>
  );
}
