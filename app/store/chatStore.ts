import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatStore {
  sessionId: string | null;
  generateNewSession: () => void;
  clearSession: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      sessionId: null,

      generateNewSession: () => {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set({ sessionId: newSessionId });
      },

      clearSession: () => {
        set({ sessionId: null });
      },
    }),
    {
      name: 'exam-gpt-chat-storage',
    }
  )
);
