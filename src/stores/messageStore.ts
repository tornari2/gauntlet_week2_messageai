/**
 * Message Store
 * 
 * Manages message state for all chats using Zustand.
 * Messages are stored in a Record keyed by chatId.
 * Integrates with AsyncStorage for offline persistence.
 */

import { create } from 'zustand';
import { Message } from '../types';
import { chatService } from '../services/chatService';
import * as storageService from '../services/storageService';
import { useNetworkStore } from './networkStore';

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
  
  // Send message with optimistic update
  sendMessageOptimistic: (chatId: string, text: string, senderId: string) => Promise<void>;
  
  // Retry failed message
  retryMessage: (chatId: string, tempId: string) => Promise<void>;
  
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
  
  // Load cached messages from AsyncStorage
  loadCachedMessages: (chatId: string) => Promise<void>;
  
  // Save messages to AsyncStorage
  saveMessagesToCache: (chatId: string) => Promise<void>;
  
  // Process offline queue when connection is restored
  processOfflineQueue: () => Promise<void>;
}

export const useMessageStore = create<MessageState & MessageActions>((set, get) => ({
  // Initial state
  messages: {},
  loading: {},
  error: {},
  unsubscribers: {},
  
  // Actions
  setMessages: (chatId, messages) => {
    set((state) => {
      const existingMessages = state.messages[chatId] || [];
      
      // Preserve pending/failed messages that aren't in the new messages from Firestore
      const pendingMessages = existingMessages.filter(
        msg => (msg.pending || msg.failed) && msg.tempId
      );
      
      // Combine Firestore messages with pending local messages
      const allMessages = [...messages];
      
      // Add pending messages that aren't already represented in Firestore
      pendingMessages.forEach(pendingMsg => {
        const existsInFirestore = messages.some(m => 
          m.id === pendingMsg.id || 
          m.tempId === pendingMsg.tempId ||
          (pendingMsg.tempId && m.id === pendingMsg.id)
        );
        if (!existsInFirestore) {
          allMessages.push(pendingMsg);
        }
      });
      
      // Remove duplicates based on ID (keep the first occurrence)
      const uniqueMessages = allMessages.filter((msg, index, self) => {
        return index === self.findIndex(m => m.id === msg.id);
      });
      
      return {
        messages: {
          ...state.messages,
          [chatId]: uniqueMessages.sort((a, b) => {
            const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp.toMillis();
            const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp.toMillis();
            return aTime - bTime;
          }),
        },
      };
    });
    
    // Save to cache asynchronously
    get().saveMessagesToCache(chatId);
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
    
    // Save to cache asynchronously
    get().saveMessagesToCache(chatId);
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
    
    // Save to cache asynchronously
    get().saveMessagesToCache(chatId);
  },
  
  subscribeToMessages: (chatId) => {
    const state = get();
    
    // Don't subscribe if already subscribed
    if (state.unsubscribers[chatId]) {
      return;
    }
    
    // Load cached messages first for instant display (including pending messages)
    get().loadCachedMessages(chatId);
    
    // Set loading state
    get().setLoading(chatId, true);
    get().setError(chatId, null);
    
    // Subscribe to messages
    const unsubscribe = chatService.subscribeToMessages(
      chatId,
      (messages) => {
        console.log(`📥 Firestore update for chat ${chatId}: ${messages.length} messages`);
        
        // Preserve pending messages when setting new messages from Firestore
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
  
  sendMessageOptimistic: async (chatId, text, senderId) => {
    // Generate temporary ID for optimistic message
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check network status
    const isConnected = useNetworkStore.getState().isConnected;
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      tempId,
      text,
      senderId,
      timestamp: new Date(),
      readBy: [senderId],
      pending: true,
    };
    
    // Add optimistic message immediately
    get().addMessage(chatId, optimisticMessage);
    
    // If offline, add to queue immediately and keep as pending
    if (!isConnected) {
      console.log('📴 Device is offline, queuing message');
      try {
        await storageService.addToOfflineQueue(chatId, optimisticMessage);
        console.log('✅ Message added to offline queue, will remain pending');
        // Keep message as pending (don't mark as failed yet)
      } catch (queueError) {
        console.error('❌ Error adding to offline queue:', queueError);
        // Mark as failed if we can't even queue it
        get().updateMessage(chatId, tempId, {
          pending: false,
          failed: true,
        });
      }
      return;
    }
    
    try {
      // Send to server (we're online)
      console.log('📡 Sending message to server...');
      const realMessageId = await chatService.sendMessage(chatId, text, senderId);
      
      // Update optimistic message with real ID and remove pending state
      console.log('✅ Message sent successfully:', realMessageId);
      get().updateMessage(chatId, tempId, {
        id: realMessageId,
        pending: false,
        tempId: undefined,
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Add to offline queue for retry when connection restored
      try {
        await storageService.addToOfflineQueue(chatId, optimisticMessage);
        console.log('Message added to offline queue');
      } catch (queueError) {
        console.error('Error adding to offline queue:', queueError);
      }
      
      // Mark message as failed
      get().updateMessage(chatId, tempId, {
        pending: false,
        failed: true,
      });
      
      throw error;
    }
  },
  
  retryMessage: async (chatId, tempId) => {
    const state = get();
    const chatMessages = state.messages[chatId] || [];
    const failedMessage = chatMessages.find(m => m.tempId === tempId && m.failed);
    
    if (!failedMessage) {
      console.error('Failed message not found');
      return;
    }
    
    // Mark as pending again
    get().updateMessage(chatId, tempId, {
      pending: true,
      failed: false,
    });
    
    try {
      // Retry sending
      const realMessageId = await chatService.sendMessage(chatId, failedMessage.text, failedMessage.senderId);
      
      // Update with real ID
      get().updateMessage(chatId, tempId, {
        id: realMessageId,
        pending: false,
        tempId: undefined,
      });
    } catch (error) {
      console.error('Error retrying message:', error);
      
      // Mark as failed again
      get().updateMessage(chatId, tempId, {
        pending: false,
        failed: true,
      });
      
      throw error;
    }
  },
  
  // Load cached messages from AsyncStorage
  loadCachedMessages: async (chatId) => {
    try {
      const cachedMessages = await storageService.getCachedMessages(chatId);
      
      if (cachedMessages.length > 0) {
        console.log(`Loaded ${cachedMessages.length} cached messages for chat ${chatId}`);
        
        // Set messages without triggering another cache save
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: cachedMessages.sort((a, b) => {
              const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp.toMillis();
              const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp.toMillis();
              return aTime - bTime;
            }),
          },
        }));
      }
    } catch (error) {
      console.error('Error loading cached messages:', error);
      // Don't throw - cached messages are not critical
    }
  },
  
  // Save messages to AsyncStorage
  saveMessagesToCache: async (chatId) => {
    try {
      const state = get();
      const messages = state.messages[chatId];
      
      if (messages && messages.length > 0) {
        await storageService.cacheMessages(chatId, messages);
      }
    } catch (error) {
      console.error('Error saving messages to cache:', error);
      // Don't throw - caching is not critical
    }
  },
  
  // Process offline queue when connection is restored
  processOfflineQueue: async () => {
    try {
      const queue = await storageService.getOfflineQueue();
      
      if (queue.length === 0) {
        return;
      }
      
      console.log(`🔄 Processing ${queue.length} messages from offline queue`);
      
      // Process each message in the queue
      for (let i = queue.length - 1; i >= 0; i--) {
        const item = queue[i];
        const { chatId, message } = item;
        
        try {
          // Try to send the message
          console.log(`📤 Attempting to send queued message for chat ${chatId}`);
          const realMessageId = await chatService.sendMessage(
            chatId,
            message.text,
            message.senderId
          );
          
          // Update message in store with real ID
          if (message.tempId) {
            get().updateMessage(chatId, message.tempId, {
              id: realMessageId,
              pending: false,
              failed: false,
              tempId: undefined,
            });
          }
          
          // Remove from queue
          await storageService.removeFromOfflineQueue(i);
          console.log(`✅ Successfully sent queued message for chat ${chatId}`);
        } catch (error) {
          console.error(`❌ Failed to send queued message for chat ${chatId}:`, error);
          // Keep in queue for next retry, but mark as failed in UI
          if (message.tempId) {
            get().updateMessage(chatId, message.tempId, {
              pending: false,
              failed: true,
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Error processing offline queue:', error);
    }
  },
}));

