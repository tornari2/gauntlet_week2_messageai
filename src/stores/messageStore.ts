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
      
      // Remove duplicates from Firestore messages FIRST
      const seenIds = new Set<string>();
      const uniqueFirestoreMessages: Message[] = [];
      
      for (const msg of messages) {
        const messageId = msg.id;
        if (!seenIds.has(messageId)) {
          seenIds.add(messageId);
          uniqueFirestoreMessages.push(msg);
        }
      }
      
      // Combine deduplicated Firestore messages with pending local messages
      const allMessages = [...uniqueFirestoreMessages];
      
      // Add pending messages that aren't already represented in Firestore
      pendingMessages.forEach(pendingMsg => {
        const existsInFirestore = uniqueFirestoreMessages.some(m => {
          // Check if Firestore has a message with the same ID
          if (m.id === pendingMsg.id) return true;
          // Check if Firestore has a message whose ID matches the pending message's tempId
          // (This handles the case where a pending message was confirmed and now exists in Firestore)
          if (pendingMsg.tempId && m.id === pendingMsg.tempId) return true;
          // Check if they have the same tempId
          if (m.tempId && pendingMsg.tempId && m.tempId === pendingMsg.tempId) return true;
          
          // IMPORTANT: Check for duplicate content (same sender, text, and similar timestamp)
          // This prevents the flicker when Firestore update arrives before we remove the temp message
          if (m.senderId === pendingMsg.senderId && m.text === pendingMsg.text) {
            const mTime = m.timestamp instanceof Date ? m.timestamp.getTime() : m.timestamp.toMillis();
            const pendingTime = pendingMsg.timestamp instanceof Date ? pendingMsg.timestamp.getTime() : pendingMsg.timestamp.toMillis();
            // If timestamps are within 5 seconds, consider them the same message
            if (Math.abs(mTime - pendingTime) < 5000) {
              return true;
            }
          }
          
          return false;
        });
        if (!existsInFirestore) {
          allMessages.push(pendingMsg);
        }
      });
      
      return {
        messages: {
          ...state.messages,
          [chatId]: allMessages.sort((a, b) => {
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
      
      const updatedMessages = existingMessages.map((m) => {
        // Match by ID or tempId
        if (m.id === messageId || m.tempId === messageId) {
          return { ...m, ...updates };
        }
        return m;
      });
      
      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages,
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
      pending: true, // Always start as pending
    };
    
    // Add optimistic message immediately
    get().addMessage(chatId, optimisticMessage);
    
    try {
      // ALWAYS try to send to Firestore, even if offline
      // Firestore's built-in offline persistence will handle queueing
      const realMessageId = await chatService.sendMessage(chatId, text, senderId);
      
      // If we're online, remove the temp message - Firestore will provide the real one
      if (isConnected) {
        set((state) => {
          const existingMessages = state.messages[chatId] || [];
          return {
            messages: {
              ...state.messages,
              [chatId]: existingMessages.filter(m => m.tempId !== tempId),
            },
          };
        });
      } else {
        // If offline, Firestore cached the write
        // Keep the temp message as pending
        // When we reconnect, Firestore will sync and add the real message
        // The subscribeToMessages will receive it and we'll remove the temp
        console.log('📴 Message sent to Firestore cache, will sync when online');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Mark message as failed
      get().updateMessage(chatId, tempId, {
        pending: false,
        failed: true,
      });
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
      
      // Remove the temp message - Firestore will provide the real one
      set((state) => {
        const existingMessages = state.messages[chatId] || [];
        return {
          messages: {
            ...state.messages,
            [chatId]: existingMessages.filter(m => m.tempId !== tempId),
          },
        };
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
      
      // Process each message in the queue in chronological order (oldest first)
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        const { chatId, message } = item;
        
        try {
          // Try to send the message
          const realMessageId = await chatService.sendMessage(
            chatId,
            message.text,
            message.senderId
          );
          
          // Remove the temp message from store - Firestore will provide the real one
          if (message.tempId) {
            set((state) => {
              const existingMessages = state.messages[chatId] || [];
              return {
                messages: {
                  ...state.messages,
                  [chatId]: existingMessages.filter(m => m.tempId !== message.tempId),
                },
              };
            });
          }
          
          // Remove from queue (always remove index 0 since we're processing in order)
          await storageService.removeFromOfflineQueue(0);
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

