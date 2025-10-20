/**
 * Message Store
 * 
 * Manages message state for all chats using Zustand.
 * Messages are stored in a Record keyed by chatId.
 */

import { create } from 'zustand';
import { Message } from '../types';
import { chatService } from '../services/chatService';

interface MessageState {
  // Messages organized by chatId: { chatId: Message[] }
  messages: Record<string, Message[]>;
  
  // Loading state per chat
  loading: Record<string, boolean>;
  
  // Error state per chat
  error: Record<string, Error | null>;
  
  // Unsubscribe functions for active subscriptions
  unsubscribers: Record<string, () => void>;
}

interface MessageActions {
  // Set all messages for a chat (from subscription)
  setMessages: (chatId: string, messages: Message[]) => void;
  
  // Add a single message to a chat (optimistic or real-time)
  addMessage: (chatId: string, message: Message) => void;
  
  // Update a message (for optimistic updates)
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  
  // Subscribe to real-time messages for a chat
  subscribeToMessages: (chatId: string) => void;
  
  // Unsubscribe from a chat's messages
  unsubscribeFromMessages: (chatId: string) => void;
  
  // Clear messages for a chat (cleanup)
  clearMessages: (chatId: string) => void;
  
  // Set loading state
  setLoading: (chatId: string, loading: boolean) => void;
  
  // Set error state
  setError: (chatId: string, error: Error | null) => void;
}

export const useMessageStore = create<MessageState & MessageActions>((set, get) => ({
  // Initial state
  messages: {},
  loading: {},
  error: {},
  unsubscribers: {},
  
  // Actions
  setMessages: (chatId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages.sort((a, b) => {
          const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp.toMillis();
          const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp.toMillis();
          return aTime - bTime;
        }),
      },
    }));
  },
  
  addMessage: (chatId, message) => {
    set((state) => {
      const existingMessages = state.messages[chatId] || [];
      
      // Check if message already exists (avoid duplicates)
      const messageExists = existingMessages.some(
        (m) => m.id === message.id || (message.tempId && m.tempId === message.tempId)
      );
      
      if (messageExists) {
        // Update existing message
        return {
          messages: {
            ...state.messages,
            [chatId]: existingMessages.map((m) =>
              m.id === message.id || (message.tempId && m.tempId === message.tempId)
                ? { ...m, ...message }
                : m
            ),
          },
        };
      }
      
      // Add new message
      const newMessages = [...existingMessages, message].sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp.toMillis();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp.toMillis();
        return aTime - bTime;
      });
      
      return {
        messages: {
          ...state.messages,
          [chatId]: newMessages,
        },
      };
    });
  },
  
  updateMessage: (chatId, messageId, updates) => {
    set((state) => {
      const existingMessages = state.messages[chatId] || [];
      
      return {
        messages: {
          ...state.messages,
          [chatId]: existingMessages.map((m) =>
            m.id === messageId || m.tempId === messageId
              ? { ...m, ...updates }
              : m
          ),
        },
      };
    });
  },
  
  subscribeToMessages: (chatId) => {
    const state = get();
    
    // Don't subscribe if already subscribed
    if (state.unsubscribers[chatId]) {
      return;
    }
    
    // Set loading state
    get().setLoading(chatId, true);
    get().setError(chatId, null);
    
    // Subscribe to messages
    const unsubscribe = chatService.subscribeToMessages(
      chatId,
      (messages) => {
        get().setMessages(chatId, messages);
        get().setLoading(chatId, false);
      },
      (error) => {
        console.error('Error in message subscription:', error);
        get().setError(chatId, error);
        get().setLoading(chatId, false);
      }
    );
    
    // Store unsubscribe function
    set((state) => ({
      unsubscribers: {
        ...state.unsubscribers,
        [chatId]: unsubscribe,
      },
    }));
  },
  
  unsubscribeFromMessages: (chatId) => {
    const state = get();
    const unsubscribe = state.unsubscribers[chatId];
    
    if (unsubscribe) {
      unsubscribe();
      
      set((state) => {
        const { [chatId]: _, ...restUnsubscribers } = state.unsubscribers;
        return { unsubscribers: restUnsubscribers };
      });
    }
  },
  
  clearMessages: (chatId) => {
    set((state) => {
      const { [chatId]: _, ...restMessages } = state.messages;
      const { [chatId]: __, ...restLoading } = state.loading;
      const { [chatId]: ___, ...restError } = state.error;
      
      return {
        messages: restMessages,
        loading: restLoading,
        error: restError,
      };
    });
  },
  
  setLoading: (chatId, loading) => {
    set((state) => ({
      loading: {
        ...state.loading,
        [chatId]: loading,
      },
    }));
  },
  
  setError: (chatId, error) => {
    set((state) => ({
      error: {
        ...state.error,
        [chatId]: error,
      },
    }));
  },
}));

