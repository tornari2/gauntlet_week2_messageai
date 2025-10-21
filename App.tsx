/**
 * App Entry Point
 * Main application component with navigation and presence tracking
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores/authStore';
import { updateOnlineStatus } from './src/services/authService';
import { ConnectionStatus } from './src/components/ConnectionStatus';

export default function App(): React.ReactElement {
  const appState = useRef(AppState.currentState);
  const { user } = useAuthStore();

  useEffect(() => {
    // Subscribe to AppState changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      subscription.remove();
    };
  }, [user]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // Only update if user is logged in
    if (!user) {
      appState.current = nextAppState;
      return;
    }

    // App is going from background to foreground
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground - setting online');
      try {
        await updateOnlineStatus(user.uid, true);
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    }

    // App is going to background
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      console.log('App has gone to the background - setting offline');
      try {
        await updateOnlineStatus(user.uid, false);
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
    }

    appState.current = nextAppState;
  };

  return (
    <>
      <ConnectionStatus />
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
