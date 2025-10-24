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
  
  // Send image with optimistic update
  sendImageOptimistic: (
    chatId: string,
    imageUri: string,
    text: string,
    senderId: string,
    imageWidth: number,
    imageHeight: number
  ) => Promise<void>;
  
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
      // Also filter out messages that still have tempId (they're from local cache, not confirmed by server)
      const isConnected = useNetworkStore.getState().isConnected;
      const seenIds = new Set<string>();
      const uniqueFirestoreMessages: Message[] = [];
      
      console.log(`[setMessages] Processing ${messages.length} Firestore messages, isConnected: ${isConnected}`);
      
      // Log image messages
      const imageMessages = messages.filter(m => m.imageUrl);
      if (imageMessages.length > 0) {
        console.log(`📸 [setMessages] Found ${imageMessages.length} messages with images`);
        imageMessages.forEach(m => {
          console.log(`📸 [setMessages] Image message ${m.id}: hasUrl=${!!m.imageUrl}, width=${m.imageWidth}, height=${m.imageHeight}, url=${m.imageUrl?.substring(0, 50)}...`);
        });
      }
      
      for (const msg of messages) {
        const messageId = msg.id;
        
        // Skip messages with tempId if we're offline (they're from cache, not confirmed)
        if (!isConnected && msg.tempId && msg.tempId.startsWith('temp_')) {
          console.log(`[setMessages] ⚠️ SKIPPING cached message with tempId while offline: ${msg.tempId}`);
          continue;
        }
        
        // Also log if message has no real ID (just temp)
        if (msg.id && msg.id.startsWith('temp_')) {
          console.log(`[setMessages] 📝 Message has temp ID: ${msg.id}, pending: ${msg.pending}, offline: ${!isConnected}`);
        }
        
        if (!seenIds.has(messageId)) {
          seenIds.add(messageId);
          
          // IMPORTANT: If we're offline and this is a message from the current user,
          // mark it as pending because it's only in Firestore's local cache
          // Check if message timestamp is very recent (within last 30 seconds)
          const msgTime = msg.timestamp instanceof Date ? msg.timestamp.getTime() : msg.timestamp.toMillis();
          const now = Date.now();
          const isRecent = (now - msgTime) < 30000; // 30 seconds
          
          // Check if this message is from an existing pending message
          const hasPendingVersion = existingMessages.some(existing => 
            existing.pending && 
            existing.text === msg.text && 
            existing.senderId === msg.senderId &&
            Math.abs((existing.timestamp instanceof Date ? existing.timestamp.getTime() : existing.timestamp.toMillis()) - msgTime) < 5000
          );
          
          // If offline and recent and from pending, keep it as pending
          if (!isConnected && isRecent && hasPendingVersion) {
            console.log(`[setMessages] 📝 Marking message ${messageId} as pending (offline, recent, was pending)`);
            uniqueFirestoreMessages.push({ ...msg, pending: true });
          } else {
            uniqueFirestoreMessages.push(msg);
          }
        }
      }
      
      console.log(`[setMessages] After filtering: ${uniqueFirestoreMessages.length} Firestore messages, ${pendingMessages.length} pending`);
      
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
          // Also check imageUrl for image messages
          // This prevents the flicker when Firestore update arrives before we remove the temp message
          if (m.senderId === pendingMsg.senderId) {
            const mTime = m.timestamp instanceof Date ? m.timestamp.getTime() : m.timestamp.toMillis();
            const pendingTime = pendingMsg.timestamp instanceof Date ? pendingMsg.timestamp.getTime() : pendingMsg.timestamp.toMillis();
            // If timestamps are within 5 seconds, check if content matches
            if (Math.abs(mTime - pendingTime) < 5000) {
              // For image messages, check imageUrl
              if (m.imageUrl && pendingMsg.imageUrl) {
                // If both have images, consider them the same (one is local URI, one is Firebase URL)
                return true;
              }
              // For text messages, check text content
              if (m.text === pendingMsg.text && m.text !== '') {
                return true;
              }
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
    
    console.log(`📤 [sendMessageOptimistic] Sending message, isConnected: ${isConnected}, tempId: ${tempId}`);
    
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
      console.log(`✅ [sendMessageOptimistic] Message sent to Firestore, realId: ${realMessageId}, tempId: ${tempId}`);
      
      // If we're online, remove the temp message - Firestore will provide the real one
      if (isConnected) {
        console.log(`🗑️ [sendMessageOptimistic] Removing temp message ${tempId} (online)`);
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
        // Keep the temp message as pending until Firestore syncs
        console.log(`📴 [sendMessageOptimistic] Message sent to Firestore cache, tempId: ${tempId}`);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Only add to AsyncStorage queue if Firestore completely failed
      // This is a fallback for when Firestore offline persistence isn't working
      if (!isConnected) {
        try {
          await storageService.addToOfflineQueue(chatId, optimisticMessage);
          console.log(`📴 [sendMessageOptimistic] Firestore failed, added to backup queue: ${tempId}`);
        } catch (queueError) {
          console.error('Failed to add message to backup queue:', queueError);
        }
      }
      
      // Mark message as failed
      get().updateMessage(chatId, tempId, {
        pending: false,
        failed: true,
      });
    }
  },
  
  sendImageOptimistic: async (
    chatId: string,
    imageUri: string,
    text: string,
    senderId: string,
    imageWidth: number,
    imageHeight: number
  ) => {
    // Generate temporary ID for optimistic message
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check network status
    const isConnected = useNetworkStore.getState().isConnected;
    
    console.log(`📤 [sendImageOptimistic] Sending image, isConnected: ${isConnected}, tempId: ${tempId}`);
    
    // Create optimistic message with placeholder
    const optimisticMessage: Message = {
      id: tempId,
      tempId,
      text,
      senderId,
      timestamp: new Date(),
      readBy: [senderId],
      pending: true,
      imageUrl: imageUri, // Use local URI as placeholder
      imageWidth,
      imageHeight,
    };
    
    // Add optimistic message immediately
    get().addMessage(chatId, optimisticMessage);
    
    try {
      // Upload image to Firebase Storage
      const { uploadImage } = await import('../services/imageService');
      const { url: uploadedUrl, width, height } = await uploadImage(
        imageUri,
        chatId,
        (progress) => {
          console.log(`Upload progress: ${Math.round(progress * 100)}%`);
        }
      );
      
      // Send message with uploaded image URL
      const realMessageId = await chatService.sendMessage(
        chatId,
        text,
        senderId,
        uploadedUrl,
        width,
        height
      );
      
      console.log(`✅ [sendImageOptimistic] Image uploaded and message sent, realId: ${realMessageId}`);
      console.log(`📸 [sendImageOptimistic] Image details - URL: ${uploadedUrl.substring(0, 50)}..., width: ${width}, height: ${height}`);
      
      // Update the optimistic message to use the Firebase URL and remove tempId
      // This way it will match the Firestore message when it arrives
      set((state) => {
        const existingMessages = state.messages[chatId] || [];
        
        // Log what we have before update
        console.log(`📊 [sendImageOptimistic] Messages before update: ${existingMessages.length}`);
        const tempMsg = existingMessages.find(m => m.tempId === tempId);
        if (tempMsg) {
          console.log(`🔍 [sendImageOptimistic] Found temp message: id=${tempMsg.id}, tempId=${tempMsg.tempId}, hasImage=${!!tempMsg.imageUrl}`);
        }
        
        const updatedMessages = existingMessages.map(m => 
          m.tempId === tempId
            ? {
                ...m,
                id: realMessageId, // Use real Firestore ID
                tempId: undefined, // Remove tempId so it's no longer "pending"
                pending: false,
                imageUrl: uploadedUrl, // Use Firebase Storage URL
                imageWidth: width,
                imageHeight: height,
              }
            : m
        );
        
        console.log(`📊 [sendImageOptimistic] Messages after map: ${updatedMessages.length}`);
        
        // Deduplicate by ID - keep the message with the Firebase Storage URL (not local file)
        const seen = new Map<string, Message>();
        updatedMessages.forEach(m => {
          if (seen.has(m.id)) {
            const existing = seen.get(m.id)!;
            // Prefer the message with Firebase Storage URL over local file URI
            if (m.imageUrl && m.imageUrl.startsWith('https://')) {
              console.log(`🔄 [sendImageOptimistic] Replacing message ${m.id} - new has Firebase URL`);
              seen.set(m.id, m);
            } else if (!existing.imageUrl || !existing.imageUrl.startsWith('https://')) {
              console.log(`🗑️ [sendImageOptimistic] Keeping existing message ${m.id}`);
            }
          } else {
            seen.set(m.id, m);
          }
        });
        
        const dedupedMessages = Array.from(seen.values());
        console.log(`📊 [sendImageOptimistic] Messages after dedup: ${dedupedMessages.length}`);
        
        return {
          messages: {
            ...state.messages,
            [chatId]: dedupedMessages,
          },
        };
      });
      
      console.log(`🔄 [sendImageOptimistic] Updated optimistic message with real ID: ${realMessageId}`);
    } catch (error) {
      console.error('❌ Error sending image:', error);
      
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
      await chatService.sendMessage(chatId, failedMessage.text, failedMessage.senderId);
      
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
      console.log('🔄 [processOfflineQueue] Starting...');
      
      // Step 1: Process AsyncStorage offline queue
      const queue = await storageService.getOfflineQueue();
      console.log(`📦 [processOfflineQueue] Found ${queue.length} messages in AsyncStorage queue`);
      
      if (queue.length === 0) {
        console.log('✅ [processOfflineQueue] Queue is empty, nothing to process');
        return;
      }
      
      // Process each message in the queue in chronological order (oldest first)
      for (let i = queue.length - 1; i >= 0; i--) {
        const item = queue[i];
        const { chatId, message } = item;
        
        console.log(`🔄 [processOfflineQueue] Processing queued message ${i}: tempId=${message.tempId}, chatId=${chatId}`);
        
        // Check if this message was already sent (by checking if a real message with similar content exists)
        const state = get();
        const chatMessages = state.messages[chatId] || [];
        
        // Look for a real message (without temp ID) with the same content
        const alreadySent = chatMessages.some(m => {
          // Check if it's a real message (has real ID, not temp)
          if (!m.id || m.id.startsWith('temp_')) return false;
          
          // Check if content matches
          if (m.senderId === message.senderId && m.text === message.text) {
            const mTime = m.timestamp instanceof Date ? m.timestamp.getTime() : m.timestamp.toMillis();
            const queueTime = new Date(message.timestamp).getTime();
            // If timestamps are within 10 seconds, consider it the same message
            if (Math.abs(mTime - queueTime) < 10000) {
              return true;
            }
          }
          
          return false;
        });
        
        if (alreadySent) {
          console.log(`✅ [processOfflineQueue] Message already sent, removing temp message and queue item: ${message.tempId}`);
          
          // Remove the temp message from store
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
          
          // Remove from queue
          await storageService.removeFromOfflineQueue(i);
          continue;
        }
        
        // Message not sent yet, try to send it
        try {
          console.log(`📤 [processOfflineQueue] Sending queued message: ${message.tempId}`);
          const realMessageId = await chatService.sendMessage(
            chatId,
            message.text,
            message.senderId
          );
          console.log(`✅ [processOfflineQueue] Queued message sent successfully: ${realMessageId}`);
          
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
          
          // Remove from queue
          await storageService.removeFromOfflineQueue(i);
        } catch (error: any) {
          console.error(`❌ Failed to send queued message for chat ${chatId}:`, error);
          
          // If chat doesn't exist anymore, remove from queue
          if (error?.message?.includes('No document to update') || 
              error?.code === 'not-found') {
            console.log(`🗑️ [processOfflineQueue] Chat ${chatId} no longer exists, removing from queue`);
            await storageService.removeFromOfflineQueue(i);
            
            // Also remove temp message from store if present
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
          } else {
            // For other errors, mark as failed in UI but keep in queue for retry
            if (message.tempId) {
              get().updateMessage(chatId, message.tempId, {
                pending: false,
                failed: true,
              });
            }
          }
        }
      }
      
      // Step 2: Clean up any orphaned temp messages that might be stuck
      // (messages that are pending but don't have a queue entry)
      console.log('🧹 [processOfflineQueue] Cleaning up orphaned temp messages...');
      const state = get();
      for (const [chatId, messages] of Object.entries(state.messages)) {
        const pendingMessages = messages.filter(m => m.pending && m.tempId);
        
        for (const pendingMsg of pendingMessages) {
          console.log(`🔍 [processOfflineQueue] Checking pending message: ${pendingMsg.tempId}`);
          
          // Check if there's a real message with the same content
          const realMessageExists = messages.some(m => {
            if (!m.id || m.id.startsWith('temp_')) return false;
            
            if (m.senderId === pendingMsg.senderId && m.text === pendingMsg.text) {
              const mTime = m.timestamp instanceof Date ? m.timestamp.getTime() : m.timestamp.toMillis();
              const pendingTime = pendingMsg.timestamp instanceof Date ? pendingMsg.timestamp.getTime() : pendingMsg.timestamp.toMillis();
              if (Math.abs(mTime - pendingTime) < 10000) {
                return true;
              }
            }
            
            return false;
          });
          
          if (realMessageExists) {
            console.log(`🗑️ [processOfflineQueue] Removing orphaned temp message: ${pendingMsg.tempId}`);
            set((state) => {
              const existingMessages = state.messages[chatId] || [];
              return {
                messages: {
                  ...state.messages,
                  [chatId]: existingMessages.filter(m => m.tempId !== pendingMsg.tempId),
                },
              };
            });
          }
        }
      }
      
      console.log('✅ [processOfflineQueue] Complete!');
    } catch (error) {
      console.error('❌ Error processing offline queue:', error);
    }
  },
}));

