/**
 * Real-time Notification Service
 * 
 * Uses Firebase Realtime Database to simulate WebSocket functionality
 * for instant message notifications without polling.
 */

import { ref, onValue, set, remove } from 'firebase/database';
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
let processedNotificationIds: Set<string> = new Set();

// Clear old processed IDs every 5 minutes to prevent memory leak
setInterval(() => {
  processedNotificationIds.clear();
}, 5 * 60 * 1000);

/**
 * Initialize real-time notification listener for a user
 * Listens for new message notifications via Firebase Realtime Database
 * @param userId - Current user's ID
 */
export function initializeRealtimeNotifications(userId: string): () => void {
  // Clean up existing listener if any
  if (notificationListener) {
    notificationListener();
  }

  // Reference to user's notification queue in Realtime Database
  const notificationsRef = ref(database, `notifications/${userId}`);

  // Track notifications per chat for grouping
  let notificationBuffer: Map<string, MessageNotificationPayload[]> = new Map();
  let processingTimeout: NodeJS.Timeout | null = null;

  // Listen for new notifications
  const unsubscribe = onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    
    if (!data) {
      return;
    }

    // Collect all new notifications, grouped by chat
    Object.entries(data).forEach(([notificationId, payload]) => {
      const notification = payload as MessageNotificationPayload;
      
      // Skip if already processed (prevents duplicates on rapid changes)
      if (processedNotificationIds.has(notificationId)) {
        return;
      }
      processedNotificationIds.add(notificationId);
      
      // Add to buffer, grouped by chatId
      const chatNotifications = notificationBuffer.get(notification.chatId) || [];
      chatNotifications.push(notification);
      notificationBuffer.set(notification.chatId, chatNotifications);

      // Remove the notification from the queue
      const notificationRef = ref(database, `notifications/${userId}/${notificationId}`);
      remove(notificationRef).catch(error => {
        console.error('Error removing notification from queue:', error);
      });
    });

    // Clear any existing timeout and schedule new processing
    if (processingTimeout) {
      clearTimeout(processingTimeout);
    }

    // Wait a short time to batch notifications from the same chat
    processingTimeout = setTimeout(() => {
      // Process all buffered notifications
      notificationBuffer.forEach((notifications) => {
        if (notifications.length === 0) return;

        // Get the last notification for this chat
        const lastNotification = notifications[notifications.length - 1];
        const count = notifications.length;

        // Build the message with count if multiple
        const messageText = count > 1 
          ? `(${count} new messages) ${lastNotification.messageText}`
          : lastNotification.messageText;
        
        // Trigger a single grouped notification per chat
        triggerMessageNotification(
          lastNotification.chatId,
          lastNotification.chatName,
          messageText,
          lastNotification.senderId
        ).catch(error => {
          console.error('Error triggering notification:', error);
        });
      });

      // Clear the buffer
      notificationBuffer.clear();
      processingTimeout = null;
    }, 300); // 300ms debounce to group rapid messages
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
  } catch (error) {
    console.error('Error sending real-time notification:', error);
  }
}

/**
 * Clean up notification listener
 */
export function cleanupRealtimeNotifications(): void {
  if (notificationListener) {
    notificationListener();
    notificationListener = null;
  }
  // Clear the processed notifications set
  processedNotificationIds.clear();
}

/**
 * Clear all pending notifications for a user
 * @param userId - User ID
 */
export async function clearPendingNotifications(userId: string): Promise<void> {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    await remove(notificationsRef);
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

