import { create } from "zustand";

export interface Message {
  role: "user" | "assistant";

  content: string;
}

interface ChatStore {
  messages: Message[];

  addMessage: (message: Message) => void;

  updateLastMessage: (token: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],

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
}));
