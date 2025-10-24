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
import { ref, onValue } from 'firebase/database';
import { firestore, database } from './firebase';
import { Chat, ChatWithDetails, User, Message } from '../types';
import { sendRealtimeNotification } from './realtimeNotificationService';

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
  // Store message subscriptions for unread count updates
  const messageUnsubscribers = new Map<string, () => void>();
  let latestChats: ChatWithDetails[] = [];

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      const chats: ChatWithDetails[] = [];
      const newUserIds = new Set<string>();
      const newChatIds = new Set<string>();
      
      for (const docSnap of snapshot.docs) {
        const chatData = docSnap.data();
        newChatIds.add(docSnap.id);
        
        // Initial unread count (will be updated by real-time listener)
        let unreadCount = 0;
        
        // Get the other participant's details for direct chats
        if (chatData.type === 'direct') {
          const otherUserId = chatData.participants.find((id: string) => id !== userId);
          if (otherUserId) {
            newUserIds.add(otherUserId);
            
            // Get the other user's profile from Firestore
            const userRef = doc(firestore, 'users', otherUserId);
            const userSnap = await getDoc(userRef);
            let otherUserName = 'Unknown User';
            let avatarColor = '#25D366'; // Default color
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              otherUserName = userData.displayName || 'Unknown User';
              avatarColor = userData.avatarColor || '#25D366';
              
              // Cache this user profile for offline access
              try {
                const { cacheUserProfiles } = await import('./storageService');
                await cacheUserProfiles([{
                  uid: userSnap.id,
                  email: userData.email || '',
                  displayName: userData.displayName || 'Unknown User',
                  photoURL: userData.photoURL || null,
                  avatarColor: userData.avatarColor,
                  isOnline: userData.isOnline || false,
                  lastSeen: userData.lastSeen || new Date(),
                  createdAt: userData.createdAt || new Date(),
                }]);
              } catch (cacheError) {
                console.error('Error caching user profile:', cacheError);
              }
            }
            
            // Get the other user's online status from RTDB (initial load)
            const { get } = await import('firebase/database');
            const otherUserStatusRef = ref(database, `/status/${otherUserId}`);
            let isOnline = false;
            let lastSeen = new Date();
            
            try {
              const statusSnapshot = await get(otherUserStatusRef);
              if (statusSnapshot.exists()) {
                const rtdbStatus = statusSnapshot.val();
                isOnline = rtdbStatus.state === 'online';
                lastSeen = rtdbStatus.last_changed ? new Date(rtdbStatus.last_changed) : new Date();
              }
            } catch (error) {
              console.error(`Error fetching initial RTDB status for ${otherUserId}:`, error);
            }
            
            const chatWithDetails: ChatWithDetails = {
              id: docSnap.id,
              type: chatData.type,
              participants: chatData.participants,
              lastMessage: chatData.lastMessage || '',
              lastMessageTime: chatData.lastMessageTime,
              createdAt: chatData.createdAt,
              otherUserName,
              otherUserOnline: isOnline,
              otherUserLastSeen: lastSeen,
              otherUserAvatarColor: avatarColor,
              unreadCount,
            };
            
            chats.push(chatWithDetails);
            
            // Subscribe to this user's status changes if not already subscribed
            if (!userStatusUnsubscribers.has(otherUserId)) {
              // Watch Realtime Database for presence (works with onDisconnect)
              const userStatusRef = ref(database, `/status/${otherUserId}`);
              const userStatusUnsubscribe = onValue(
                userStatusRef,
                (snapshot) => {
                  const rtdbStatus = snapshot.val();
                  if (rtdbStatus) {
                    const isOnline = rtdbStatus.state === 'online';
                    
                    // Update this user's status in all chats
                    latestChats = latestChats.map(chat => {
                      if (chat.type === 'direct' && chat.participants.includes(otherUserId)) {
                        return {
                          ...chat,
                          otherUserOnline: isOnline,
                          otherUserLastSeen: rtdbStatus.last_changed ? new Date(rtdbStatus.last_changed) : new Date(),
                        };
                      }
                      return chat;
                    });
                    onChatsUpdate([...latestChats]);
                  }
                },
                (error) => {
                  console.error(`Error subscribing to user ${otherUserId} RTDB status:`, error);
                }
              );
              
              // Also subscribe to user profile changes in Firestore (for name and color updates)
              const userDocRef = doc(firestore, 'users', otherUserId);
              const userProfileUnsubscribe = onSnapshot(
                userDocRef,
                (docSnapshot) => {
                  if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    const newName = userData.displayName || 'Unknown User';
                    const newColor = userData.avatarColor || '#25D366';
                    
                    console.log(`👤 Profile update for user ${otherUserId}:`, { newName, newColor });
                    
                    // Update this user's profile in all chats
                    latestChats = latestChats.map(chat => {
                      if (chat.type === 'direct' && chat.participants.includes(otherUserId)) {
                        return {
                          ...chat,
                          otherUserName: newName,
                          otherUserAvatarColor: newColor,
                        };
                      }
                      return chat;
                    });
                    console.log(`🔄 Updating chat list with profile changes for ${otherUserId}`);
                    onChatsUpdate([...latestChats]);
                  }
                },
                (error) => {
                  console.error(`Error subscribing to user ${otherUserId} profile:`, error);
                }
              );
              
              // Store both unsubscribe functions
              userStatusUnsubscribers.set(otherUserId, () => {
                userStatusUnsubscribe();
                userProfileUnsubscribe();
              });
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
        
        // Set up real-time listener for unread count if not already subscribed
        if (!messageUnsubscribers.has(docSnap.id)) {
          const messagesRef = collection(firestore, 'chats', docSnap.id, 'messages');
          const messagesUnsubscribe = onSnapshot(
            messagesRef,
            (messagesSnapshot) => {
              // Calculate unread count
              let newUnreadCount = 0;
              messagesSnapshot.forEach((msgDoc) => {
                const msgData = msgDoc.data();
                // Count messages not sent by current user and not read by them
                if (msgData.senderId !== userId && !msgData.readBy?.includes(userId)) {
                  newUnreadCount++;
                }
              });
              
              // Update the unread count for this specific chat
              latestChats = latestChats.map(chat => {
                if (chat.id === docSnap.id) {
                  return {
                    ...chat,
                    unreadCount: newUnreadCount,
                  };
                }
                return chat;
              });
              
              onChatsUpdate([...latestChats]);
            },
            (error) => {
              console.error(`Error subscribing to messages for chat ${docSnap.id}:`, error);
            }
          );
          
          messageUnsubscribers.set(docSnap.id, messagesUnsubscribe);
        }
      }
      
      // Clean up subscriptions for users no longer in the chat list
      for (const [subscribedUserId, unsubFunc] of userStatusUnsubscribers.entries()) {
        if (!newUserIds.has(subscribedUserId)) {
          unsubFunc();
          userStatusUnsubscribers.delete(subscribedUserId);
        }
      }
      
      // Clean up message subscriptions for chats no longer in the list
      for (const [chatId, unsubFunc] of messageUnsubscribers.entries()) {
        if (!newChatIds.has(chatId)) {
          unsubFunc();
          messageUnsubscribers.delete(chatId);
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

  // Return a function that unsubscribes from everything
  return () => {
    unsubscribe();
    // Clean up all user status subscriptions
    for (const unsubFunc of userStatusUnsubscribers.values()) {
      unsubFunc();
    }
    userStatusUnsubscribers.clear();
    // Clean up all message subscriptions
    for (const unsubFunc of messageUnsubscribers.values()) {
      unsubFunc();
    }
    messageUnsubscribers.clear();
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
      
      // Cache this user profile for offline access
      try {
        const { cacheUserProfiles } = await import('./storageService');
        await cacheUserProfiles([{
          uid: userSnap.id,
          email: userData.email || '',
          displayName: userData.displayName || 'Unknown User',
          photoURL: userData.photoURL || null,
          avatarColor: userData.avatarColor,
          isOnline: userData.isOnline || false,
          lastSeen: userData.lastSeen || new Date(),
          createdAt: userData.createdAt || new Date(),
        }]);
      } catch (cacheError) {
        // Don't fail if caching fails
        console.error('Error caching user profile:', cacheError);
      }
      
      return userData.displayName || 'Unknown User';
    }
    
    return 'Unknown User';
  } catch (error: any) {
    // If offline, try to load from cache
    if (error?.code === 'unavailable' || 
        error?.message?.includes('offline') ||
        error?.message?.includes('network')) {
      console.log(`📦 Network unavailable for user ${userId}, loading from cache`);
      
      try {
        const { getCachedUserProfile } = await import('./storageService');
        const cachedUser = await getCachedUserProfile(userId);
        
        if (cachedUser) {
          console.log(`✅ Loaded user ${cachedUser.displayName} from cache`);
          return cachedUser.displayName;
        }
      } catch (cacheError) {
        console.error('Error loading user from cache:', cacheError);
      }
    } else {
      // Only log non-network errors
      console.error('Error fetching user display name:', error);
    }
    
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
    
    // Get chat details to send notifications to other participants
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      const chatData = chatSnap.data() as Chat;
      const otherParticipants = chatData.participants.filter(id => id !== senderId);
      
      // Get sender's display name for notification
      const senderName = await getUserDisplayName(senderId);
      
      // Determine chat name based on chat type
      let chatName = senderName;
      if (chatData.type === 'group' && chatData.groupName) {
        chatName = `${senderName} in ${chatData.groupName}`;
      }
      
      // Send real-time notifications to all other participants
      const notificationPromises = otherParticipants.map(participantId =>
        sendRealtimeNotification(
          participantId,
          chatId,
          chatName,
          text,
          senderId
        ).catch(error => {
          console.error(`Failed to send notification to ${participantId}:`, error);
        })
      );
      
      await Promise.all(notificationPromises);
    }
    
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
      // Don't include groupPhoto if it's not provided - Firestore doesn't accept undefined
    };
    
    await setDoc(newChatRef, newChat);
    
    return newChatRef.id;
  } catch (error) {
    console.error('❌ Error creating group chat:', error);
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

