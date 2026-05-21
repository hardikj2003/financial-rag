"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

import { streamMessage } from "@/services/chat/chat.service";
import { useChatStore } from "@/store/chat/chat.store";
import { Source } from "@/store/chat/chat.store";

export default function ChatContainer() {
  const { getToken } = useAuth();

  const {
    activeChatId,
    addMessage,
    updateLastMessage,
    updateLastMessageSources,
  } = useChatStore();

  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || !activeChatId) {
      return;
    }
    const token = await getToken();
    if (!token) {
      console.error("No authentication token found");
      return;
    }
    addMessage({
      role: "user",
      content: query,
    });
    setLoading(true);
    try {
      let started = false;
      await streamMessage(
        token,
        query,
        activeChatId,
        (streamToken: string) => {
          if (!started) {
            addMessage({
              role: "assistant",
              content: streamToken,
            });

            started = true;
          } else {
            updateLastMessage(streamToken);
          }
        },
        (sources: Source[]) => {
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
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <main className="flex flex-1 flex-col">
        <MessageList loading={loading} />
        <ChatInput onSend={handleSendMessage} disabled={loading} />
      </main>
    </div>
  );
}
