"use client";

import { useEffect } from "react";

import { Plus, PanelLeft, FolderOpen, MessageSquare } from "lucide-react";

import UploadDashboard from "../upload/UploadDashboard";

import ChatHistory from "./ChatHistory";

import {
  createChat,
  getChats,
  getChatMessages,
} from "@/services/chat/chat.service";
import { useChatStore } from "@/store/chat/chat.store";

export default function Sidebar() {
  const { chats, setChats, setMessages, setActiveChat } = useChatStore();

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await getChats();
      const existingChats = response.chats || [];

      setChats(existingChats);

      if (existingChats.length === 0) {
        const newResponse = await createChat();
        const newChat = newResponse.chat;

        setChats([newChat]);
        setActiveChat(newChat.id);
      } else {
        // restore latest chat
        const latestChat = existingChats[0];
        setActiveChat(latestChat.id);
        const messagesResponse = await getChatMessages(latestChat.id);
        setMessages(messagesResponse.messages);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await createChat();
      const newChat = response.chat;
      setChats([newChat, ...chats]);
      setMessages([]);
      setActiveChat(newChat.id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      setActiveChat(chatId);

      const response = await getChatMessages(chatId);

      setMessages(response.messages);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <aside className="hidden h-screen w-87.5 border-r border-slate-200 bg-slate-50 md:flex md:flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <PanelLeft size={18} />
          </div>

          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              Financial RAG
            </h1>

            <p className="text-xs text-slate-400">AI Financial Workspace</p>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-slate-800"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Chat History */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <MessageSquare size={14} className="text-slate-400" />

          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Recent Chats
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <ChatHistory onSelectChat={handleSelectChat} />
        </div>
      </div>

      {/* Upload Workspace */}
      <div className="border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <FolderOpen size={14} className="text-slate-400" />

          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Documents
          </h2>
        </div>

        <div className="max-h-85 overflow-y-auto px-5 pb-5">
          <UploadDashboard />
        </div>
      </div>
    </aside>
  );
}
