/**
 * Chat Store
 * 
 * Manages chat state using Zustand:
 * - List of user's chats
 * - Currently selected chat
 * - Loading and error states
 * - Real-time subscription to chats
 */

import { create } from 'zustand';
import { Chat } from '../types';
import { chatService } from '../services/chatService';

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  loading: boolean;
  error: string | null;
}

interface ChatActions {
  setChats: (chats: Chat[]) => void;
  setCurrentChat: (chat: Chat | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  subscribeToChats: (userId: string) => () => void;
  createOrGetDirectChat: (currentUserId: string, otherUserId: string) => Promise<string>;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  chats: [],
  currentChat: null,
  loading: false,
  error: null,

  // Actions
  setChats: (chats) => set({ chats }),
  
  setCurrentChat: (chat) => set({ currentChat: chat }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  /**
   * Subscribe to user's chats in real-time
   * Returns an unsubscribe function
   */
  subscribeToChats: (userId: string) => {
    set({ loading: true, error: null });
    
    const unsubscribe = chatService.subscribeToUserChats(userId, (chats) => {
      set({ chats, loading: false });
    }, (error) => {
      console.error('Error subscribing to chats:', error);
      set({ error: 'Failed to load chats', loading: false });
    });

    return unsubscribe;
  },

  /**
   * Create a new direct chat or get existing one
   */
  createOrGetDirectChat: async (currentUserId: string, otherUserId: string) => {
    try {
      set({ loading: true, error: null });
      const chatId = await chatService.createOrGetDirectChat(currentUserId, otherUserId);
      set({ loading: false });
      return chatId;
    } catch (error: any) {
      console.error('Error creating/getting chat:', error);
      set({ error: error.message || 'Failed to create chat', loading: false });
      throw error;
    }
  },
}));

