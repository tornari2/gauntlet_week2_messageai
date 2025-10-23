/**
 * Notification Service
 * 
 * Handles local notifications, in-app banners, and notification permissions.
 * Uses local notifications instead of push notifications to work with Expo Go.
 */

import * as Notifications from 'expo-notifications';
import { Platform, AppState, AppStateStatus } from 'react-native';
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

/**
 * Schedule a local notification
 * Shown when app is in background or not in the specific chat
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Custom data to include
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any
): Promise<string> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
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
        { chatId, senderId }
      );
    }
  } catch (error) {
    console.error('Error triggering message notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
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
  getNotificationPermissions,
  setBadgeCount,
  getBadgeCount,
};

