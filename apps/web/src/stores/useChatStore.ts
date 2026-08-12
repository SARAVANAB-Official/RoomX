import { create } from 'zustand';
import type { ChatMessage } from '@roomx/shared';

interface ChatState {
  messages: ChatMessage[];
  typingUsers: string[];
  unreadCount: number;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  removeMessage: (messageId: string) => void;
  pinMessage: (messageId: string, pinned: boolean) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  clearUnread: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  typingUsers: [],
  unreadCount: 0,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      unreadCount: state.unreadCount + 1,
    })),

  setMessages: (messages) => set({ messages, unreadCount: 0 }),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    })),

  pinMessage: (messageId, pinned) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, reactions: m.reactions }
          : m
      ),
    })),

  setTyping: (userId, isTyping) =>
    set((state) => ({
      typingUsers: isTyping
        ? [...new Set([...state.typingUsers, userId])]
        : state.typingUsers.filter((id) => id !== userId),
    })),

  clearUnread: () => set({ unreadCount: 0 }),
}));
