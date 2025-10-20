/**
 * Chat Service
 * 
 * Handles all chat-related Firestore operations:
 * - Creating direct chats
 * - Subscribing to user's chats
 * - Getting chat participants
 */

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  getDocs,
  serverTimestamp,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Chat, User } from '../types';

/**
 * Subscribe to a user's chats in real-time
 * @param userId - The user's ID
 * @param onChatsUpdate - Callback when chats change
 * @param onError - Callback for errors
 * @returns Unsubscribe function
 */
export function subscribeToUserChats(
  userId: string,
  onChatsUpdate: (chats: Chat[]) => void,
  onError?: (error: Error) => void
): () => void {
  const chatsRef = collection(firestore, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      const chats: Chat[] = [];
      
      for (const docSnap of snapshot.docs) {
        const chatData = docSnap.data();
        
        // Get the other participant's name for direct chats
        if (chatData.type === 'direct') {
          const otherUserId = chatData.participants.find((id: string) => id !== userId);
          if (otherUserId) {
            const participantName = await getUserDisplayName(otherUserId);
            chats.push({
              id: docSnap.id,
              ...chatData,
              participantName,
            } as Chat);
          }
        } else {
          // Group chat
          chats.push({
            id: docSnap.id,
            ...chatData,
          } as Chat);
        }
      }
      
      onChatsUpdate(chats);
    },
    (error) => {
      console.error('Error in chat subscription:', error);
      onError?.(error as Error);
    }
  );

  return unsubscribe;
}

/**
 * Get a user's display name from Firestore
 * @param userId - The user's ID
 * @returns The user's display name or 'Unknown User'
 */
async function getUserDisplayName(userId: string): Promise<string> {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data() as User;
      return userData.displayName || 'Unknown User';
    }
    
    return 'Unknown User';
  } catch (error) {
    console.error('Error fetching user display name:', error);
    return 'Unknown User';
  }
}

/**
 * Get participants' information for a chat
 * @param chatId - The chat ID
 * @returns Array of participant IDs
 */
export async function getChatParticipants(chatId: string): Promise<string[]> {
  try {
    const chatRef = doc(firestore, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (chatSnap.exists()) {
      const chatData = chatSnap.data() as Chat;
      return chatData.participants;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching chat participants:', error);
    throw new Error('Failed to fetch chat participants');
  }
}

/**
 * Create a new direct chat or get existing one
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @returns Chat ID
 */
export async function createOrGetDirectChat(
  userId1: string,
  userId2: string
): Promise<string> {
  try {
    // Check if chat already exists
    const chatsRef = collection(firestore, 'chats');
    const q = query(
      chatsRef,
      where('type', '==', 'direct'),
      where('participants', 'array-contains', userId1)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Look for existing chat with both users
    for (const docSnap of querySnapshot.docs) {
      const chatData = docSnap.data();
      if (chatData.participants.includes(userId2)) {
        return docSnap.id;
      }
    }
    
    // Create new chat if doesn't exist
    const newChatRef = doc(collection(firestore, 'chats'));
    const newChat: Omit<Chat, 'id'> = {
      type: 'direct',
      participants: [userId1, userId2],
      lastMessage: '',
      lastMessageTime: serverTimestamp() as Timestamp,
      createdAt: serverTimestamp() as Timestamp,
      unreadCount: 0,
    };
    
    await setDoc(newChatRef, newChat);
    
    return newChatRef.id;
  } catch (error) {
    console.error('Error creating/getting direct chat:', error);
    throw new Error('Failed to create or get chat');
  }
}

export const chatService = {
  subscribeToUserChats,
  getChatParticipants,
  createOrGetDirectChat,
};

