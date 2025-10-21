/**
 * Notification Service
 * 
 * Handles push notification registration, permissions, and token management
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Register for push notifications and get Expo push token
 * @returns Expo push token or null if registration failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if running on a physical device
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Check if permission was granted
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get the Expo push token
    // Note: projectId is optional for Expo Go, but required for standalone builds
    const tokenData = await Notifications.getExpoPushTokenAsync();

    // Android-specific channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#25D366',
      });
    }

    return tokenData.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Set up notification handler for foreground notifications
 * This determines how notifications are displayed when app is in foreground
 */
export function setNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Schedule a local notification (for testing)
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
  registerForPushNotifications,
  setNotificationHandler,
  scheduleLocalNotification,
  cancelAllNotifications,
  getNotificationPermissions,
  setBadgeCount,
  getBadgeCount,
};

