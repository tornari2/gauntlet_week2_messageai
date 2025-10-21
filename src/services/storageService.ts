/**
 * Storage Service - AsyncStorage caching layer
 * 
 * Provides persistent storage for messages and chat data using AsyncStorage.
 * This enables instant load of recent messages and offline functionality.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../types';

// Storage keys
const STORAGE_KEYS = {
  MESSAGES: 'messages_',
  CHAT_LIST: 'chat_list',
  OFFLINE_QUEUE: 'offline_queue',
} as const;

// Maximum number of messages to cache per chat
const MAX_CACHED_MESSAGES = 100;

/**
 * Cache messages for a specific chat
 * Stores last 100 messages to AsyncStorage
 */
export const cacheMessages = async (
  chatId: string,
  messages: Message[]
): Promise<void> => {
  try {
    // Sort by timestamp (most recent first) and limit to MAX_CACHED_MESSAGES
    const sortedMessages = [...messages]
      .sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp.toMillis();
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp.toMillis();
        return timeB - timeA;
      })
      .slice(0, MAX_CACHED_MESSAGES);

    // Convert Firestore Timestamps to ISO strings for storage
    const serializableMessages = sortedMessages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date 
        ? msg.timestamp.toISOString()
        : msg.timestamp.toDate().toISOString(),
      readBy: msg.readBy || [],
    }));

    const key = `${STORAGE_KEYS.MESSAGES}${chatId}`;
    await AsyncStorage.setItem(key, JSON.stringify(serializableMessages));
    
    console.log(`Cached ${serializableMessages.length} messages for chat ${chatId}`);
  } catch (error) {
    console.error('Error caching messages:', error);
    // Don't throw - caching is not critical
  }
};

/**
 * Get cached messages for a specific chat
 * Returns empty array if no cache exists
 */
export const getCachedMessages = async (
  chatId: string
): Promise<Message[]> => {
  try {
    const key = `${STORAGE_KEYS.MESSAGES}${chatId}`;
    const cached = await AsyncStorage.getItem(key);
    
    if (!cached) {
      return [];
    }

    const messages = JSON.parse(cached);
    
    // Convert ISO strings back to Date objects
    return messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch (error) {
    console.error('Error retrieving cached messages:', error);
    return [];
  }
};

/**
 * Clear cached messages for a specific chat
 */
export const clearCachedMessages = async (chatId: string): Promise<void> => {
  try {
    const key = `${STORAGE_KEYS.MESSAGES}${chatId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cached messages:', error);
  }
};

/**
 * Add message to offline queue
 * Messages in queue will be sent when connection is restored
 */
export const addToOfflineQueue = async (
  chatId: string,
  message: Message
): Promise<void> => {
  try {
    const queue = await getOfflineQueue();
    
    const queueItem = {
      chatId,
      message: {
        ...message,
        timestamp: message.timestamp instanceof Date
          ? message.timestamp.toISOString()
          : message.timestamp.toDate().toISOString(),
      },
      addedAt: new Date().toISOString(),
    };
    
    queue.push(queueItem);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    
    console.log(`Added message to offline queue for chat ${chatId}`);
  } catch (error) {
    console.error('Error adding to offline queue:', error);
    throw error;
  }
};

/**
 * Get all messages in offline queue
 */
export const getOfflineQueue = async (): Promise<any[]> => {
  try {
    const queue = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
};

/**
 * Remove message from offline queue
 */
export const removeFromOfflineQueue = async (index: number): Promise<void> => {
  try {
    const queue = await getOfflineQueue();
    queue.splice(index, 1);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Error removing from offline queue:', error);
  }
};

/**
 * Clear entire offline queue
 */
export const clearOfflineQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
};

/**
 * Clear all cached data (use for logout)
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const messageKeys = keys.filter((key) => key.startsWith(STORAGE_KEYS.MESSAGES));
    
    await AsyncStorage.multiRemove([
      ...messageKeys,
      STORAGE_KEYS.CHAT_LIST,
      STORAGE_KEYS.OFFLINE_QUEUE,
    ]);
    
    console.log('All cache cleared');
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
};

