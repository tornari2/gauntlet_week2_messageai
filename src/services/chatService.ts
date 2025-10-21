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
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Chat, ChatWithDetails, User, Message } from '../types';

/**
 * Subscribe to a user's chats in real-time
 * @param userId - The user's ID
 * @param onChatsUpdate - Callback when chats change
 * @param onError - Callback for errors
 * @returns Unsubscribe function
 */
export function subscribeToUserChats(
  userId: string,
  onChatsUpdate: (chats: ChatWithDetails[]) => void,
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
      const chats: ChatWithDetails[] = [];
      
      for (const docSnap of snapshot.docs) {
        const chatData = docSnap.data();
        
        // Calculate unread count for this chat
        const messagesRef = collection(firestore, 'chats', docSnap.id, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);
        let unreadCount = 0;
        
        messagesSnapshot.forEach((msgDoc) => {
          const msgData = msgDoc.data();
          // Count messages not sent by current user and not read by them
          if (msgData.senderId !== userId && !msgData.readBy?.includes(userId)) {
            unreadCount++;
          }
        });
        
        // Get the other participant's details for direct chats
        if (chatData.type === 'direct') {
          const otherUserId = chatData.participants.find((id: string) => id !== userId);
          if (otherUserId) {
            const otherUserName = await getUserDisplayName(otherUserId);
            
            // Get the other user's online status and last seen
            const otherUserRef = doc(firestore, 'users', otherUserId);
            const otherUserSnap = await getDoc(otherUserRef);
            const otherUserData = otherUserSnap.exists() ? otherUserSnap.data() : null;
            
            chats.push({
              id: docSnap.id,
              type: chatData.type,
              participants: chatData.participants,
              lastMessage: chatData.lastMessage || '',
              lastMessageTime: chatData.lastMessageTime,
              createdAt: chatData.createdAt,
              otherUserName,
              otherUserOnline: otherUserData?.isOnline || false,
              otherUserLastSeen: otherUserData?.lastSeen?.toDate() || new Date(),
              unreadCount,
            });
          }
        } else {
          // Group chat
          chats.push({
            id: docSnap.id,
            type: chatData.type,
            participants: chatData.participants,
            lastMessage: chatData.lastMessage || '',
            lastMessageTime: chatData.lastMessageTime,
            createdAt: chatData.createdAt,
            groupName: chatData.groupName,
            groupPhoto: chatData.groupPhoto,
            unreadCount,
          });
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
    };
    
    await setDoc(newChatRef, newChat);
    
    return newChatRef.id;
  } catch (error) {
    console.error('Error creating/getting direct chat:', error);
    throw new Error('Failed to create or get chat');
  }
}

/**
 * Send a message to a chat
 * @param chatId - The chat ID
 * @param text - The message text
 * @param senderId - The sender's user ID
 * @returns The message ID
 */
export async function sendMessage(
  chatId: string,
  text: string,
  senderId: string
): Promise<string> {
  try {
    // Create message in messages subcollection
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const newMessage = {
      text,
      senderId,
      timestamp: serverTimestamp(),
      readBy: [senderId], // Sender has read their own message
    };
    
    const messageDoc = await addDoc(messagesRef, newMessage);
    
    // Update chat's lastMessage and lastMessageTime
    const chatRef = doc(firestore, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
    });
    
    return messageDoc.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
}

/**
 * Subscribe to messages in a chat in real-time
 * @param chatId - The chat ID
 * @param onMessagesUpdate - Callback when messages change
 * @param onError - Callback for errors
 * @returns Unsubscribe function
 */
export function subscribeToMessages(
  chatId: string,
  onMessagesUpdate: (messages: Message[]) => void,
  onError?: (error: Error) => void
): () => void {
  const messagesRef = collection(firestore, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = [];
      
      snapshot.forEach((docSnap) => {
        const messageData = docSnap.data();
        messages.push({
          id: docSnap.id,
          text: messageData.text || '',
          senderId: messageData.senderId,
          timestamp: messageData.timestamp || new Date(),
          readBy: messageData.readBy || [],
          pending: messageData.pending,
          failed: messageData.failed,
          tempId: messageData.tempId,
        } as Message);
      });
      
      onMessagesUpdate(messages);
    },
    (error) => {
      console.error('Error in messages subscription:', error);
      onError?.(error as Error);
    }
  );
  
  return unsubscribe;
}

/**
 * Mark messages as read by a user
 * @param chatId - The chat ID
 * @param messageIds - Array of message IDs to mark as read
 * @param userId - The user ID marking messages as read
 */
export async function markMessagesAsRead(
  chatId: string,
  messageIds: string[],
  userId: string
): Promise<void> {
  try {
    const batch: Promise<void>[] = [];
    
    for (const messageId of messageIds) {
      const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);
      const messageSnap = await getDoc(messageRef);
      
      if (messageSnap.exists()) {
        const messageData = messageSnap.data() as Message;
        
        // Only update if user hasn't already read it
        if (!messageData.readBy?.includes(userId)) {
          batch.push(
            updateDoc(messageRef, {
              readBy: [...(messageData.readBy || []), userId],
            })
          );
        }
      }
    }
    
    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw new Error('Failed to mark messages as read');
  }
}

export const chatService = {
  subscribeToUserChats,
  getChatParticipants,
  createOrGetDirectChat,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
};

