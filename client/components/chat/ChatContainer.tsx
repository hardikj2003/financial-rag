"use client";

import { useEffect, useState } from "react";

import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

import { createChat, streamMessage } from "@/services/chat.service";

import { useChatStore } from "@/store/chat.store";

export default function ChatContainer() {
  const { messages, addMessage, updateLastMessage } = useChatStore();

  const [chatId, setChatId] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeChat = async () => {
      const response = await createChat();

      setChatId(response.chat.id);
    };

    initializeChat();
  }, []);

  const handleSendMessage = async (query: string) => {
    if (!query.trim()) return;

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
      await streamMessage(query, chatId, (token) => {
        updateLastMessage(token);
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <MessageList loading={loading} />

        <ChatInput onSend={handleSendMessage} disabled={loading} />
      </div>
    </div>
  );
}
