/**
 * App Entry Point
 * Main application component with navigation, presence tracking, and notifications
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores/authStore';
import { useNotificationStore } from './src/stores/notificationStore';
import { setupPresence, updatePresence } from './src/services/presenceService';
import { ConnectionStatus } from './src/components/ConnectionStatus';
import { NotificationBanner } from './src/components/NotificationBanner';
import { registerForLocalNotifications, setNotificationHandler } from './src/services/notificationService';
import { initializeRealtimeNotifications } from './src/services/realtimeNotificationService';

export default function App(): React.ReactElement {
  const appState = useRef(AppState.currentState);
  const { user } = useAuthStore();
  const { currentNotification, dismissNotification } = useNotificationStore();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const presenceCleanup = useRef<(() => void) | null>(null);
  const realtimeCleanup = useRef<(() => void) | null>(null);

  // Set up notification handler on mount (one-time setup)
  useEffect(() => {
    setNotificationHandler();
  }, []);

  // Set up presence system and real-time notifications when user logs in
  useEffect(() => {
    if (user) {
      // Set up presence tracking with automatic disconnect detection
      presenceCleanup.current = setupPresence(user.uid);
      
      // Register for local notifications
      registerLocalNotifications();

      // Initialize real-time notification listener (WebSocket-style)
      realtimeCleanup.current = initializeRealtimeNotifications(user.uid);
    } else {
      // Clean up presence when user logs out
      if (presenceCleanup.current) {
        presenceCleanup.current();
        presenceCleanup.current = null;
      }

      // Clean up real-time notifications
      if (realtimeCleanup.current) {
        realtimeCleanup.current();
        realtimeCleanup.current = null;
      }
    }

    return () => {
      // Clean up on unmount
      if (presenceCleanup.current) {
        presenceCleanup.current();
      }
      if (realtimeCleanup.current) {
        realtimeCleanup.current();
      }
    };
  }, [user]);

  // Helper functions defined before useEffects that use them
  const registerLocalNotifications = async () => {
    try {
      const granted = await registerForLocalNotifications();
      if (granted) {
        console.log('✅ Local notifications registered');
      } else {
        console.log('❌ Local notification permissions denied');
      }
    } catch (error) {
      console.error('Error registering for local notifications:', error);
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    try {
      const data = response.notification.request.content.data;
      
      // Handle navigation based on notification data
      if (data.chatId) {
        console.log('📱 Navigate to chat:', data.chatId);
        // Navigation will be handled through the navigation ref
        // TODO: Implement navigation when notification is tapped
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  };

  const handleBannerPress = (notification: any) => {
    console.log('📱 Banner pressed:', notification);
    // Navigate to chat
    if (notification.chatId) {
      // TODO: Implement navigation when banner is pressed
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
    <SafeAreaProvider>
      {/* In-app notification banner */}
      <NotificationBanner
        notification={currentNotification}
        onDismiss={dismissNotification}
        onPress={handleBannerPress}
      />
      
      {/* Connection status indicator */}
      <ConnectionStatus />
      
      {/* Main navigation */}
      <AppNavigator />
      
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
