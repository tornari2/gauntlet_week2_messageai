/**
 * Real-time Notification Service
 * 
 * Uses Firebase Realtime Database to simulate WebSocket functionality
 * for instant message notifications without polling.
 */

import { ref, onValue, set, remove, DatabaseReference } from 'firebase/database';
import { database } from './firebase';
import { triggerMessageNotification } from './notificationService';
import { useAuthStore } from '../stores/authStore';

interface MessageNotificationPayload {
  chatId: string;
  chatName: string;
  messageText: string;
  senderId: string;
  timestamp: number;
}

let notificationListener: (() => void) | null = null;

/**
 * Initialize real-time notification listener for a user
 * Listens for new message notifications via Firebase Realtime Database
 * @param userId - Current user's ID
 */
export function initializeRealtimeNotifications(userId: string): () => void {
  console.log('🔌 Initializing real-time notifications for user:', userId);
  
  // Clean up existing listener if any
  if (notificationListener) {
    notificationListener();
  }

  // Reference to user's notification queue in Realtime Database
  const notificationsRef = ref(database, `notifications/${userId}`);

  // Listen for new notifications
  const unsubscribe = onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    
    if (!data) {
      return;
    }

    // Process each notification
    Object.entries(data).forEach(([notificationId, payload]) => {
      const notification = payload as MessageNotificationPayload;
      
      // Trigger the notification (in-app or local)
      triggerMessageNotification(
        notification.chatId,
        notification.chatName,
        notification.messageText,
        notification.senderId
      ).catch(error => {
        console.error('Error triggering notification:', error);
      });

      // Remove the notification from the queue after processing
      const notificationRef = ref(database, `notifications/${userId}/${notificationId}`);
      remove(notificationRef).catch(error => {
        console.error('Error removing notification from queue:', error);
      });
    });
  });

  notificationListener = unsubscribe;
  return unsubscribe;
}

/**
 * Send a notification to a specific user
 * Used by the message sender to notify recipients
 * @param recipientId - User ID to notify
 * @param chatId - Chat ID
 * @param chatName - Name of the chat/sender
 * @param messageText - Message content
 * @param senderId - ID of the sender
 */
export async function sendRealtimeNotification(
  recipientId: string,
  chatId: string,
  chatName: string,
  messageText: string,
  senderId: string
): Promise<void> {
  try {
    // Don't send notification to yourself
    const currentUser = useAuthStore.getState().user;
    if (currentUser && recipientId === currentUser.uid) {
      return;
    }

    const notificationId = `${chatId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notificationRef = ref(database, `notifications/${recipientId}/${notificationId}`);

    const payload: MessageNotificationPayload = {
      chatId,
      chatName,
      messageText: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
      senderId,
      timestamp: Date.now(),
    };

    await set(notificationRef, payload);
    console.log('📤 Sent real-time notification to user:', recipientId);
  } catch (error) {
    console.error('Error sending real-time notification:', error);
  }
}

/**
 * Clean up notification listener
 */
export function cleanupRealtimeNotifications(): void {
  if (notificationListener) {
    console.log('🔌 Cleaning up real-time notification listener');
    notificationListener();
    notificationListener = null;
  }
}

/**
 * Clear all pending notifications for a user
 * @param userId - User ID
 */
export async function clearPendingNotifications(userId: string): Promise<void> {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    await remove(notificationsRef);
    console.log('🗑️ Cleared pending notifications');
  } catch (error) {
    console.error('Error clearing pending notifications:', error);
  }
}

export const realtimeNotificationService = {
  initializeRealtimeNotifications,
  sendRealtimeNotification,
  cleanupRealtimeNotifications,
  clearPendingNotifications,
};

