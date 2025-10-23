/**
 * Typing Service
 * 
 * Manages typing indicators using Firebase Realtime Database
 * for real-time, ephemeral typing state tracking.
 * 
 * Path structure: /typing/{chatId}/{userId}
 * Auto-cleanup after 3 seconds of inactivity
 */

import { ref, set, remove, onValue, get } from 'firebase/database';
import { database } from './firebase';

interface TypingState {
  userId: string;
  timestamp: number;
}

const TYPING_TIMEOUT = 5000; // 5 seconds - more forgiving timeout

/**
 * Set user as typing in a chat
 * @param chatId - Chat ID
 * @param userId - User ID who is typing
 */
export const setUserTyping = async (
  chatId: string,
  userId: string
): Promise<void> => {
  try {
    const typingRef = ref(database, `typing/${chatId}/${userId}`);
    const timestamp = Date.now();
    console.log(`🟠 [TypingService] Writing typing status: chat=${chatId}, user=${userId}, timestamp=${timestamp}`);
    await set(typingRef, {
      timestamp,
    });
    console.log(`🟠 [TypingService] ✅ Successfully wrote typing status for user ${userId}`);
  } catch (error) {
    console.error('❌ Error setting typing status:', error);
  }
};

/**
 * Set user as stopped typing in a chat
 * @param chatId - Chat ID
 * @param userId - User ID who stopped typing
 */
export const setUserStoppedTyping = async (
  chatId: string,
  userId: string
): Promise<void> => {
  try {
    const typingRef = ref(database, `typing/${chatId}/${userId}`);
    console.log(`🟠 [TypingService] Removing typing status: chat=${chatId}, user=${userId}`);
    await remove(typingRef);
    console.log(`🟠 [TypingService] ✅ Successfully removed typing status for user ${userId}`);
  } catch (error) {
    console.error('❌ Error removing typing status:', error);
  }
};

/**
 * Subscribe to typing indicators for a chat
 * Returns list of user IDs who are currently typing (excluding current user)
 * Auto-filters out stale typing indicators (>5 seconds old)
 * 
 * @param chatId - Chat ID
 * @param currentUserId - Current user's ID (to exclude from results)
 * @param callback - Called when typing users change
 * @returns Unsubscribe function
 */
export const subscribeToTypingIndicators = (
  chatId: string,
  currentUserId: string,
  callback: (typingUserIds: string[]) => void
): (() => void) => {
  const typingRef = ref(database, `typing/${chatId}`);
  
  // Keep track of last notified state to prevent unnecessary updates
  let lastTypingUsers: string[] = [];
  
  // Process and filter typing indicators
  const processTypingData = (data: any) => {
    console.log(`🔵 [Typing] Chat ${chatId}: Raw RTDB data for currentUser=${currentUserId}:`, JSON.stringify(data, null, 2));
    
    if (!data) {
      // Only callback if there's a change
      if (lastTypingUsers.length > 0) {
        console.log(`🔵 [Typing] Chat ${chatId}: No typing data, clearing indicators`);
        lastTypingUsers = [];
        callback([]);
      }
      return;
    }

    const now = Date.now();
    const typingUsers: string[] = [];

    // Filter out current user and stale typing indicators
    Object.entries(data).forEach(([userId, state]) => {
      const typingState = state as TypingState;
      
      console.log(`🔵 [Typing] Chat ${chatId}: Examining user ${userId}, timestamp: ${typingState.timestamp}, age: ${now - typingState.timestamp}ms`);
      
      // Skip current user
      if (userId === currentUserId) {
        console.log(`🔵 [Typing] Chat ${chatId}: ❌ Skipping current user ${userId}`);
        return;
      }

      // Check if stale (>5 seconds old) - just filter it out
      const age = now - typingState.timestamp;
      if (age > TYPING_TIMEOUT) {
        console.log(`🔵 [Typing] Chat ${chatId}: ❌ User ${userId} is STALE (${age}ms > ${TYPING_TIMEOUT}ms)`);
        return;
      }

      console.log(`🔵 [Typing] Chat ${chatId}: ✅ User ${userId} is TYPING (${age}ms old)`);
      typingUsers.push(userId);
    });

    // Sort for consistent comparison
    typingUsers.sort();
    
    console.log(`🔵 [Typing] Chat ${chatId}: Final typing users array:`, typingUsers);
    
    // Only callback if the list actually changed
    const hasChanged = 
      typingUsers.length !== lastTypingUsers.length ||
      typingUsers.some((userId, index) => userId !== lastTypingUsers[index]);
    
    if (hasChanged) {
      console.log(`🔵 [Typing] Chat ${chatId}: ✅ CHANGED from [${lastTypingUsers.join(', ')}] to [${typingUsers.join(', ')}]`);
      lastTypingUsers = typingUsers;
      callback([...typingUsers]); // Clone array to prevent external mutation
    } else {
      console.log(`🔵 [Typing] Chat ${chatId}: ⏸️  UNCHANGED: [${typingUsers.join(', ')}]`);
    }
  };
  
  // Subscribe to Firebase updates - this gives us real-time updates
  const unsubscribe = onValue(typingRef, (snapshot) => {
    processTypingData(snapshot.val());
  });

  return unsubscribe;
};

/**
 * Clear all typing indicators for a user across all chats
 * Useful for cleanup on logout
 * @param userId - User ID
 */
export const clearAllTypingIndicators = async (
  userId: string
): Promise<void> => {
  try {
    // Note: In a production app, you might want to track which chats
    // a user is typing in and clear them individually
    // For now, this is a placeholder that could be enhanced
    console.log('Clearing typing indicators for user:', userId);
  } catch (error) {
    console.error('Error clearing typing indicators:', error);
  }
};

/**
 * Clean up stale typing indicators for a specific chat
 * Called periodically to prevent buildup of stale data
 * @param chatId - Chat ID
 */
export const cleanupStaleTypingIndicators = async (
  chatId: string
): Promise<void> => {
  try {
    const typingRef = ref(database, `typing/${chatId}`);
    const snapshot = await get(typingRef);
    
    if (!snapshot.exists()) {
      return;
    }

    const data = snapshot.val();
    const now = Date.now();

    // Remove stale entries
    const cleanupPromises: Promise<void>[] = [];
    Object.entries(data).forEach(([userId, state]) => {
      const typingState = state as TypingState;
      if (now - typingState.timestamp > TYPING_TIMEOUT) {
        cleanupPromises.push(
          remove(ref(database, `typing/${chatId}/${userId}`))
        );
      }
    });

    await Promise.all(cleanupPromises);
  } catch (error) {
    console.error('Error cleaning up stale typing indicators:', error);
  }
};

export const typingService = {
  setUserTyping,
  setUserStoppedTyping,
  subscribeToTypingIndicators,
  clearAllTypingIndicators,
  cleanupStaleTypingIndicators,
};

