"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  LayoutGrid,
  MessageSquare,
  Shield,
  Terminal,
  BookOpenText,
} from "lucide-react";
import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import ChatHistory from "./ChatHistory";
import Button from "../ui/Button";
import {
  createChat,
  getChats,
  getChatMessages,
} from "@/services/chat/chat.service";
import { useChatStore } from "@/store/chat/chat.store";
import { getAdminStatus } from "@/services/admin/admin.service";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const { getToken } = useAuth();
  const { chats, setChats, setMessages, setActiveChat, activeChatId } =
    useChatStore();
  const [isAdmin, setIsAdmin] = useState(false);

  // FIXED: Added empty dependency array [] to prevent infinite re-render loop
  useEffect(() => {
    const checkAdminStatus = async () => {
      const token = await getToken();
      if (!token) return;
      const response = await getAdminStatus(token);
      setIsAdmin(response.isAdmin);
    };
    checkAdminStatus();
  }, [getToken]);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const response = await getChats(token);
        const existingChats = response.chats || [];
        setChats(existingChats);
        if (existingChats.length === 0) {
          const newResponse = await createChat(token);
          const newChat = newResponse.chat;
          setChats([newChat]);
          setActiveChat(newChat.id);
        } else {
          const latestChat = existingChats[0];
          setActiveChat(latestChat.id);
          const messagesResponse = await getChatMessages(latestChat.id, token);
          setMessages(messagesResponse.messages);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadChats();
  }, [getToken, setChats, setMessages, setActiveChat]);

  const handleNewChat = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await createChat(token);
      const newChat = response.chat;
      setChats([newChat, ...chats]);
      setMessages([]);
      setActiveChat(newChat.id);
      onClose?.();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      setActiveChat(chatId);
      const response = await getChatMessages(chatId, token);
      setMessages(response.messages);
      onClose?.();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-80 max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-300 md:static md:z-auto md:max-w-none md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-stone-100 px-6 py-5">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-sm">
                <LayoutGrid size={20} />
              </div>

              <div>
                <h1 className="text-sm font-bold tracking-tight text-stone-900">
                  Finance<span className="text-orange-600">RAG</span>
                </h1>

                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                  AI Research Workspace
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-3 text-sm font-semibold text-white transition-all hover:bg-stone-800"
          >
            <Plus size={17} />
            New Chat
          </Button>
        </div>

        {/* Main Navigation Content (single scroll region) */}
        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
          <Link
            href="/docs"
            className="mb-4 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-xs font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-white"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white">
              <BookOpenText size={14} />
            </span>
            Interactive RAG Docs
          </Link>

          <div className="mb-3 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <MessageSquare size={13} className="text-orange-600" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                Recent Chats
              </h2>
            </div>
          </div>

          <ChatHistory
            onSelectChat={handleSelectChat}
            activeChatId={activeChatId}
          />
        </div>

        {/* Footer Area with Refined Layout Blocks */}
        <div className="shrink-0 px-4 pb-4 pt-2 space-y-3">
        {/* Redesigned Admin Button Panel (Appears stacked right above the profile segment) */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-xs transition-all duration-200 hover:bg-stone-50 hover:border-stone-300 shadow-2xs group"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-white group-hover:bg-orange-600 transition-colors duration-200">
                <Shield size={13} />
              </div>
              <div>
                <p className="font-semibold text-stone-800">
                  Operator Terminal
                </p>
                <p className="text-[10px] text-stone-400 font-medium">
                  Access system analytics
                </p>
              </div>
            </div>
            <Terminal
              size={12}
              className="text-stone-300 group-hover:text-stone-500 transition-colors"
            />
          </Link>
        )}

        {/* Unified Profile Control Banner */}
        <div className="flex items-center justify-between border-t border-stone-100 pt-3 px-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-stone-800">
              Financial RAG
            </p>
            <p className="text-[10px] text-stone-400 font-medium">
              Production Workspace
            </p>
          </div>
          <div className="shrink-0 pl-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "h-8 w-8 rounded-xl border border-stone-200 shadow-2xs",
                },
              }}
            />
          </div>
        </div>
        </div>
      </aside>
    </>
  );
}
