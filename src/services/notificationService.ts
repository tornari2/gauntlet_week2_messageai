/**
 * Notification Service
 * 
 * Handles local notifications, in-app banners, and notification permissions.
 * Uses local notifications instead of push notifications to work with Expo Go.
 */

import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';
import { useNotificationStore } from '../stores/notificationStore';
import { NotificationData } from '../components/NotificationBanner';

/**
 * Register for local notifications and request permissions
 * @returns true if permissions granted, false otherwise
 */
export async function registerForLocalNotifications(): Promise<boolean> {
  try {
    // Check existing permissions (this might fail on emulator)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Check if permission was granted
    if (finalStatus !== 'granted') {
      // Silently fail - user can still use in-app banners
      return false;
    }

    // Android-specific channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#25D366',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    // Silently fail on emulators or when notifications aren't available
    // In-app banners will still work
    return false;
  }
}

/**
 * Set up notification handler for foreground notifications
 * This determines how notifications are displayed when app is in foreground
 */
export function setNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false, // We handle this with in-app banner
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  });
}

/**
 * Show an in-app notification banner (when app is in foreground)
 * @param notification - Notification data to display
 */
export function showInAppNotification(notification: NotificationData): void {
  const notificationStore = useNotificationStore.getState();
  notificationStore.showNotification(notification);
}

// Track pending notifications per chat to group them
const pendingNotifications: Map<string, { count: number, lastMessage: string, chatName: string }> = new Map();

/**
 * Schedule a local notification with grouping
 * Shown when app is in background or not in the specific chat
 * Groups multiple messages from the same chat
 * @param title - Notification title
 * @param body - Notification body
 * @param chatId - Chat ID for grouping
 * @param data - Custom data to include
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  chatId: string,
  data?: any
): Promise<string> {
  try {
    // Cancel any existing notification for this chat
    const existingNotifications = await Notifications.getPresentedNotificationsAsync();
    for (const notif of existingNotifications) {
      if (notif.request.content.data?.chatId === chatId) {
        await Notifications.dismissNotificationAsync(notif.request.identifier);
      }
    }

    // Track this notification
    const existing = pendingNotifications.get(chatId);
    if (existing) {
      existing.count++;
      existing.lastMessage = body;
    } else {
      pendingNotifications.set(chatId, {
        count: 1,
        lastMessage: body,
        chatName: title,
      });
    }

    const groupData = pendingNotifications.get(chatId)!;
    const displayBody = groupData.count > 1 
      ? `(${groupData.count} new messages) ${groupData.lastMessage}`
      : groupData.lastMessage;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: groupData.chatName,
        body: displayBody,
        data: { ...data, chatId, messageCount: groupData.count },
        sound: true,
        badge: groupData.count,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling local notification:', error);
    throw error;
  }
}

/**
 * Trigger notification for new message
 * Shows in-app banner if app is foreground, local notification if background
 * @param chatId - Chat ID
 * @param chatName - Name of the chat/sender
 * @param messageText - Message content
 * @param senderId - ID of the sender
 */
export async function triggerMessageNotification(
  chatId: string,
  chatName: string,
  messageText: string,
  senderId: string
): Promise<void> {
  try {
    const appState = AppState.currentState;
    const notificationStore = useNotificationStore.getState();
    const activeChatId = notificationStore.activeChatId;

    // Don't notify if user is viewing this chat
    if (activeChatId === chatId) {
      // Clear pending count for this chat since they're viewing it
      pendingNotifications.delete(chatId);
      return;
    }

    const notification: NotificationData = {
      id: `${chatId}_${Date.now()}`,
      title: chatName,
      body: messageText,
      chatId,
      senderId,
      timestamp: Date.now(),
    };

    // If app is in foreground, show in-app banner
    if (appState === 'active') {
      showInAppNotification(notification);
    } else {
      // If app is in background, show grouped local notification
      await scheduleLocalNotification(
        chatName,
        messageText,
        chatId,
        { chatId, senderId }
      );
    }
  } catch (error) {
    console.error('Error triggering message notification:', error);
  }
}

/**
 * Cancel all scheduled notifications and clear pending counts
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
    pendingNotifications.clear();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

/**
 * Clear notification count for a specific chat
 * Call this when user opens a chat
 */
export function clearChatNotificationCount(chatId: string): void {
  pendingNotifications.delete(chatId);
}

/**
 * Get notification permissions status
 * @returns Permission status
 */
export async function getNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
  try {
    const permissions = await Notifications.getPermissionsAsync();
    return permissions;
  } catch (error) {
    console.error('Error getting notification permissions:', error);
    throw error;
  }
}

/**
 * Badge management - set app icon badge number
 * @param count - Badge count (0 to clear)
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Get current badge count
 * @returns Current badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    const count = await Notifications.getBadgeCountAsync();
    return count;
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

export const notificationService = {
  registerForLocalNotifications,
  setNotificationHandler,
  scheduleLocalNotification,
  triggerMessageNotification,
  showInAppNotification,
  cancelAllNotifications,
  clearChatNotificationCount,
  getNotificationPermissions,
  setBadgeCount,
  getBadgeCount,
};

