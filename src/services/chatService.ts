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
  deleteDoc,
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

  // Store user status subscriptions
  const userStatusUnsubscribers = new Map<string, () => void>();
  let latestChats: ChatWithDetails[] = [];

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      const chats: ChatWithDetails[] = [];
      const newUserIds = new Set<string>();
      
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
            newUserIds.add(otherUserId);
            const otherUserName = await getUserDisplayName(otherUserId);
            
            // Get the other user's online status and last seen (initial load)
            const otherUserRef = doc(firestore, 'users', otherUserId);
            const otherUserSnap = await getDoc(otherUserRef);
            const otherUserData = otherUserSnap.exists() ? otherUserSnap.data() : null;
            
            const chatWithDetails: ChatWithDetails = {
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
            };
            
            chats.push(chatWithDetails);
            
            // Subscribe to this user's status changes if not already subscribed
            if (!userStatusUnsubscribers.has(otherUserId)) {
              const userStatusUnsubscribe = onSnapshot(
                doc(firestore, 'users', otherUserId),
                (userDoc) => {
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Update this user's status in all chats
                    latestChats = latestChats.map(chat => {
                      if (chat.type === 'direct' && chat.participants.includes(otherUserId)) {
                        return {
                          ...chat,
                          otherUserOnline: userData.isOnline || false,
                          otherUserLastSeen: userData.lastSeen?.toDate() || new Date(),
                        };
                      }
                      return chat;
                    });
                    onChatsUpdate([...latestChats]);
                  }
                },
                (error) => {
                  console.error(`Error subscribing to user ${otherUserId} status:`, error);
                }
              );
              userStatusUnsubscribers.set(otherUserId, userStatusUnsubscribe);
            }
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
      
      // Clean up subscriptions for users no longer in the chat list
      for (const [subscribedUserId, unsubFunc] of userStatusUnsubscribers.entries()) {
        if (!newUserIds.has(subscribedUserId)) {
          unsubFunc();
          userStatusUnsubscribers.delete(subscribedUserId);
        }
      }
      
      latestChats = chats;
      onChatsUpdate(chats);
    },
    (error) => {
      console.error('Error in chat subscription:', error);
      onError?.(error as Error);
    }
  );

  // Return a function that unsubscribes from both chats and user statuses
  return () => {
    unsubscribe();
    // Clean up all user status subscriptions
    for (const unsubFunc of userStatusUnsubscribers.values()) {
      unsubFunc();
    }
    userStatusUnsubscribers.clear();
  };
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

/**
 * Create a new group chat
 * @param creatorId - The creator's user ID
 * @param participantIds - Array of participant user IDs (excluding creator)
 * @param groupName - The name of the group
 * @returns Chat ID
 */
export async function createGroupChat(
  creatorId: string,
  participantIds: string[],
  groupName: string
): Promise<string> {
  try {
    // Add creator to participants list
    const allParticipants = [creatorId, ...participantIds];
    
    // Create new group chat
    const newChatRef = doc(collection(firestore, 'chats'));
    const newChat: Omit<Chat, 'id'> = {
      type: 'group',
      participants: allParticipants,
      lastMessage: '',
      lastMessageTime: serverTimestamp() as Timestamp,
      createdAt: serverTimestamp() as Timestamp,
      groupName,
      // groupPhoto can be added later
    };
    
    await setDoc(newChatRef, newChat);
    
    return newChatRef.id;
  } catch (error) {
    console.error('Error creating group chat:', error);
    throw new Error('Failed to create group chat');
  }
}

/**
 * Add a participant to an existing group chat
 * @param chatId - The chat ID
 * @param userId - The user ID to add
 */
export async function addParticipant(
  chatId: string,
  userId: string
): Promise<void> {
  try {
    const chatRef = doc(firestore, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      throw new Error('Chat not found');
    }
    
    const chatData = chatSnap.data() as Chat;
    
    if (chatData.type !== 'group') {
      throw new Error('Can only add participants to group chats');
    }
    
    // Check if user is already a participant
    if (chatData.participants.includes(userId)) {
      return; // Already a participant
    }
    
    // Add user to participants array
    await updateDoc(chatRef, {
      participants: [...chatData.participants, userId],
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    throw new Error('Failed to add participant');
  }
}

/**
 * Remove a participant from a group chat
 * @param chatId - The chat ID
 * @param userId - The user ID to remove
 */
export async function removeParticipant(
  chatId: string,
  userId: string
): Promise<void> {
  try {
    const chatRef = doc(firestore, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      throw new Error('Chat not found');
    }
    
    const chatData = chatSnap.data() as Chat;
    
    if (chatData.type !== 'group') {
      throw new Error('Can only remove participants from group chats');
    }
    
    // Remove user from participants array
    const updatedParticipants = chatData.participants.filter(id => id !== userId);
    
    // Don't allow removing the last participant
    if (updatedParticipants.length === 0) {
      throw new Error('Cannot remove the last participant from a group');
    }
    
    await updateDoc(chatRef, {
      participants: updatedParticipants,
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    throw new Error('Failed to remove participant');
  }
}

/**
 * Get chat details by ID
 * @param chatId - The chat ID
 * @returns Chat object
 */
export async function getChatById(chatId: string): Promise<Chat | null> {
  try {
    const chatRef = doc(firestore, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (chatSnap.exists()) {
      return {
        id: chatSnap.id,
        ...chatSnap.data(),
      } as Chat;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw new Error('Failed to fetch chat');
  }
}

/**
 * Get multiple users' display names
 * @param userIds - Array of user IDs
 * @returns Record of userId -> displayName
 */
export async function getUserDisplayNames(
  userIds: string[]
): Promise<Record<string, string>> {
  try {
    const names: Record<string, string> = {};
    
    await Promise.all(
      userIds.map(async (userId) => {
        const name = await getUserDisplayName(userId);
        names[userId] = name;
      })
    );
    
    return names;
  } catch (error) {
    console.error('Error fetching user display names:', error);
    return {};
  }
}

/**
 * Delete a chat and all its messages
 * @param chatId - The chat ID to delete
 * @param userId - The user ID requesting the deletion
 */
export async function deleteChat(
  chatId: string,
  userId: string
): Promise<void> {
  try {
    const chatRef = doc(firestore, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      throw new Error('Chat not found');
    }
    
    const chatData = chatSnap.data() as Chat;
    
    // Verify the user is a participant
    if (!chatData.participants.includes(userId)) {
      throw new Error('User is not a participant in this chat');
    }
    
    // Delete all messages in the chat
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
    
    const deleteBatch: Promise<void>[] = [];
    messagesSnapshot.forEach((messageDoc) => {
      const messageRef = doc(firestore, 'chats', chatId, 'messages', messageDoc.id);
      deleteBatch.push(deleteDoc(messageRef));
    });
    
    await Promise.all(deleteBatch);
    
    // Delete the chat document
    await deleteDoc(chatRef);
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw new Error('Failed to delete chat');
  }
}

export const chatService = {
  subscribeToUserChats,
  getChatParticipants,
  createOrGetDirectChat,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
  createGroupChat,
  addParticipant,
  removeParticipant,
  getChatById,
  getUserDisplayNames,
  deleteChat,
};

