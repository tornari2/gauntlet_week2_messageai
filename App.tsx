/**
 * App Entry Point
 * Main application component with navigation, presence tracking, and push notifications
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores/authStore';
import { updatePushToken } from './src/services/authService';
import { setupPresence, updatePresence } from './src/services/presenceService';
import { ConnectionStatus } from './src/components/ConnectionStatus';
import { registerForPushNotifications, setNotificationHandler } from './src/services/notificationService';

export default function App(): React.ReactElement {
  const appState = useRef(AppState.currentState);
  const { user } = useAuthStore();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const presenceCleanup = useRef<(() => void) | null>(null);

  // Set up notification handler on mount (one-time setup)
  useEffect(() => {
    setNotificationHandler();
  }, []);

  // Set up presence system when user logs in
  useEffect(() => {
    if (user) {
      // Set up presence tracking with automatic disconnect detection
      presenceCleanup.current = setupPresence(user.uid);
      
      // Also register for push notifications
      registerPushNotifications();
    } else {
      // Clean up presence when user logs out
      if (presenceCleanup.current) {
        presenceCleanup.current();
        presenceCleanup.current = null;
      }
    }

    return () => {
      // Clean up on unmount
      if (presenceCleanup.current) {
        presenceCleanup.current();
      }
    };
  }, [user]);

  // Helper functions defined before useEffects that use them
  const registerPushNotifications = async () => {
    try {
      if (!user) return;

      const token = await registerForPushNotifications();
      if (token) {
        console.log('Push token:', token);
        // Store token in Firestore
        await updatePushToken(user.uid, token);
      } else {
        console.log('Failed to get push token');
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    try {
      const data = response.notification.request.content.data;
      
      // Handle navigation based on notification data
      if (data.chatId) {
        // Note: We'll handle navigation through the AppNavigator
        // by storing the pending navigation in a ref or state
        console.log('Navigate to chat:', data.chatId);
        // Navigation will be handled in AppNavigator component
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  };

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    console.log('📱 AppState change detected:', appState.current, '→', nextAppState);
    
    // Only update if user is logged in
    if (!user) {
      console.log('⚠️ No user logged in, skipping presence update');
      appState.current = nextAppState;
      return;
    }

    // App is going from background to foreground
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('📱 App has come to the foreground - setting online');
      try {
        await updatePresence(user.uid, true);
        console.log('✅ Successfully set user online via AppState change');
      } catch (error) {
        console.error('❌ Error updating online status:', error);
      }
    }

    // App is going to background
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      console.log('📱 App has gone to the background - setting offline');
      try {
        await updatePresence(user.uid, false);
        console.log('✅ Successfully set user offline via AppState change');
      } catch (error) {
        console.error('❌ Error updating offline status:', error);
      }
    }

    appState.current = nextAppState;
  }, [user]);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Subscribe to AppState changes for presence tracking
  useEffect(() => {
    console.log('📱 Setting up AppState listener for presence tracking');
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      console.log('📱 Removing AppState listener');
      subscription.remove();
    };
  }, [handleAppStateChange]);

  return (
    <>
      <ConnectionStatus />
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
