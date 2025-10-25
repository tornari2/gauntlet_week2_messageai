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

// Track displayed notifications per chat to prevent duplicates
const displayedNotifications: Map<string, string> = new Map();

/**
 * Schedule a local notification
 * Shown when app is in background or not in the specific chat
 * Replaces any existing notification for the same chat
 * @param title - Notification title
 * @param body - Notification body (should already include message count if multiple)
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
    // Cancel any existing notification for this chat to prevent duplicates
    const existingNotificationId = displayedNotifications.get(chatId);
    if (existingNotificationId) {
      await Notifications.dismissNotificationAsync(existingNotificationId);
    }

    // Also check for any other notifications from this chat
    const existingNotifications = await Notifications.getPresentedNotificationsAsync();
    for (const notif of existingNotifications) {
      if (notif.request.content.data?.chatId === chatId) {
        await Notifications.dismissNotificationAsync(notif.request.identifier);
      }
    }

    // Schedule the new notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: { ...data, chatId },
        sound: true,
        badge: 1,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });
    
    // Track this notification
    displayedNotifications.set(chatId, notificationId);
    
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
 * @param messageText - Message content (may already include count like "(3 new messages) text")
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
      // Clear displayed notification for this chat since they're viewing it
      displayedNotifications.delete(chatId);
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
      // If app is in background, show local notification
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
 * Cancel all scheduled notifications and clear tracking
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
    displayedNotifications.clear();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

/**
 * Clear notification tracking for a specific chat
 * Call this when user opens a chat
 */
export async function clearChatNotificationCount(chatId: string): Promise<void> {
  displayedNotifications.delete(chatId);
  
  // Also dismiss any visible notifications for this chat
  try {
    const existingNotifications = await Notifications.getPresentedNotificationsAsync();
    for (const notif of existingNotifications) {
      if (notif.request.content.data?.chatId === chatId) {
        await Notifications.dismissNotificationAsync(notif.request.identifier);
      }
    }
  } catch (error) {
    console.error('Error clearing chat notifications:', error);
  }
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

