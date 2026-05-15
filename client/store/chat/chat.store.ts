import { create } from "zustand";
import { ChatSession } from "@/types/chat";

export interface Source {
  text: string;
  documentName: string;
  chunkIndex: number;
  score: number;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface ChatStore {
  chats: ChatSession[];
  activeChatId: string;
  messages: Message[];
  setChats: (chats: ChatSession[]) => void;
  setActiveChat: (chatId: string) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (token: string) => void;
  updateLastMessageSources: (sources: Source[]) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  activeChatId: "",
  messages: [],

  setChats: (chats) =>
    set({
      chats,
    }),

  setActiveChat: (chatId) =>
    set({
      activeChatId: chatId,
    }),

  setMessages: (messages) =>
    set({
      messages,
    }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateLastMessage: (token) =>
    set((state) => {
      const updated = [...state.messages];
      const last = updated[updated.length - 1];

      if (last && last.role === "assistant") {
        last.content += token;
      }

      return {
        messages: updated,
      };
    }),

  updateLastMessageSources: (sources) =>
    set((state) => {
      const updated = [...state.messages];
      const last = updated[updated.length - 1];

      if (last && last.role === "assistant") {
        last.sources = sources;
      }
      return {
        messages: updated,
      };
    }),
}));
