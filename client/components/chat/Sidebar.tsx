"use client";

import { useEffect, useState } from "react"; // Added useState
import {
  Plus,
  LayoutGrid,
  FolderOpen,
  MessageSquare,
  Settings2,
  Search,
  ChevronDown, // Added for the dropdown icon
} from "lucide-react";
import UploadDashboard from "../upload/UploadDashboard";
import ChatHistory from "./ChatHistory";
import {
  createChat,
  getChats,
  getChatMessages,
} from "@/services/chat/chat.service";
import { useChatStore } from "@/store/chat/chat.store";
import Button from "../ui/Button";

export default function Sidebar() {
  const { chats, setChats, setMessages, setActiveChat, activeChatId } =
    useChatStore();

  // State to manage the Knowledge Base dropdown
  const [isKBOpen, setIsKBOpen] = useState(false);

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
    <aside className="hidden h-screen w-80 border-r border-slate-200 bg-white md:flex md:flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200">
              <LayoutGrid size={20} />
            </div>
            <div>
              <h1 className="text-[15px] font-bold tracking-tight text-slate-900 leading-none">
                Finance<span className="text-blue-600">RAG</span>
              </h1>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                v1.0 Terminal
              </p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <Settings2 size={18} />
          </button>
        </div>

        <Button
          onClick={handleNewChat}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
        >
          <Plus
            size={18}
            className="transition-transform group-hover:rotate-90"
          />
          Start New Analysis
        </Button>
      </div>

      {/* History Area - This now takes more space when KB is closed */}
      <div className="flex flex-1 flex-col overflow-hidden px-4">
        <div className="mb-2 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <MessageSquare size={13} className="text-blue-600" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              History
            </h2>
          </div>
          <button className="rounded-md p-1 hover:bg-slate-100 text-slate-400">
            <Search size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
          <ChatHistory
            onSelectChat={handleSelectChat}
            activeChatId={activeChatId}
          />
        </div>

        {/* Knowledge Base Dropdown Section */}
        <div className="mt-auto border-t border-slate-100 py-4">
          <button
            onClick={() => setIsKBOpen(!isKBOpen)}
            className={`flex w-full items-center justify-between rounded-xl px-2 py-3 transition-colors ${
              isKBOpen ? "bg-slate-50" : "hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderOpen
                size={13}
                className={isKBOpen ? "text-blue-600" : "text-slate-400"}
              />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Knowledge Base
              </h2>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-300 ${
                isKBOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Collapsible Content */}
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              isKBOpen
                ? "grid-rows-[1fr] opacity-100 mt-2"
                : "grid-rows-[0fr] opacity-0 overflow-hidden"
            }`}
          >
            <div className="overflow-hidden">
              <div className="max-h-72 overflow-y-auto rounded-2xl bg-slate-50 border border-slate-100 p-2 no-scrollbar">
                <UploadDashboard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
