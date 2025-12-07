import { create } from "zustand";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatStore {
  sessionId: string | null;
  messages: Message[];
  generateNewSession: () => void;
  clearSession: () => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  updateMessage: (id: string, content: string) => void;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  sessionId: null,
  messages: [],

  generateNewSession: () => {
    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    set({ sessionId: newSessionId });
  },

  clearSession: () => {
    set({ sessionId: null, messages: [] });
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  updateMessage: (id: string, content: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    }));
  },
}));
