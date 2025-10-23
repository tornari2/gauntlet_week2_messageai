/**
 * ConnectionStatus Component
 * 
 * Displays a banner at the bottom of the screen when the app is offline or reconnecting.
 * Also processes the offline message queue when connection is restored.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useMessageStore } from '../stores/messageStore';
import { useNetworkStore } from '../stores/networkStore';
import { Colors } from '../constants/Colors';

export const ConnectionStatus: React.FC = () => {
  const [slideAnim] = useState(new Animated.Value(50)); // Start hidden below screen
  const { isConnected, setConnected } = useNetworkStore();
  const processOfflineQueue = useMessageStore((state) => state.processOfflineQueue);
  
  // Use refs to avoid re-renders when these callbacks change
  const processOfflineQueueRef = useRef(processOfflineQueue);
  
  // Keep refs up to date
  useEffect(() => {
    processOfflineQueueRef.current = processOfflineQueue;
  }, [processOfflineQueue]);

  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch().then((state) => {
      // Consider connected only if we have internet reachability
      const connected = (state.isConnected && state.isInternetReachable !== false) ?? false;
      console.log('[ConnectionStatus] Initial network state:', { 
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        computed: connected 
      });
      setConnected(connected); // Call the function directly
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      try {
        console.log('[ConnectionStatus] 🔵 NetInfo event fired, processing...');
        
        // Consider connected only if we have internet reachability
        // isInternetReachable can be null (unknown), true, or false
        // We treat null as potentially connected (optimistic)
        const connected = (state.isConnected && state.isInternetReachable !== false) ?? false;
        console.log('[ConnectionStatus] Network state changed:', { 
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
          computed: connected 
        });
        
        // Check previous state from store
        const prevConnected = useNetworkStore.getState().isConnected;
        console.log('[ConnectionStatus] Previous connected state:', prevConnected);
        
        // Update global network store - call the function directly!
        setConnected(connected);
        console.log('[ConnectionStatus] Updated store to:', connected);
        
        // If reconnected, Firestore will automatically sync pending writes
        if (connected && !prevConnected) {
          console.log('[ConnectionStatus] 🎉 Reconnected! Firestore will auto-sync pending messages...');
          // No need to manually process queue - Firestore handles it automatically
        }
        
        console.log('[ConnectionStatus] ✅ NetInfo event processed successfully');
      } catch (error) {
        console.error('[ConnectionStatus] ❌ ERROR in NetInfo listener:', error);
      }
    });

    // Poll network state every 3 seconds when offline to catch reconnections
    // NetInfo sometimes doesn't fire events immediately on iOS
    const pollInterval = setInterval(() => {
      const currentState = useNetworkStore.getState().isConnected;
      if (!currentState) {
        console.log('[ConnectionStatus] 🔍 Polling network state while offline...');
        NetInfo.fetch().then((state) => {
          const connected = (state.isConnected && state.isInternetReachable !== false) ?? false;
          console.log('[ConnectionStatus] Poll result:', {
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable,
            computed: connected
          });
          if (connected !== currentState) {
            console.log('[ConnectionStatus] 📡 Poll detected state change!');
            setConnected(connected);
            if (connected) {
              console.log('[ConnectionStatus] 🎉 Reconnected via polling! Processing offline queue...');
              processOfflineQueueRef.current();
            }
          }
        });
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
    // Empty dependency array - only set up once on mount
  }, []); // setConnected is stable, no dependencies needed

  useEffect(() => {
    // Animate banner in/out based on connection status
    console.log('[ConnectionStatus] Animation effect triggered, isConnected:', isConnected);
    Animated.timing(slideAnim, {
      toValue: isConnected ? 50 : 0, // Slide down when offline, hide when connected
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      console.log('[ConnectionStatus] Animation completed, banner is now:', isConnected ? 'hidden' : 'visible');
    });
  }, [isConnected, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents={isConnected ? 'none' : 'box-none'} // Don't block touches when connected or hidden
    >
      <View style={[styles.banner, isConnected ? styles.connectedBanner : styles.offlineBanner]}>
        <Text style={styles.text}>
          {isConnected ? 'Connected' : 'No internet connection'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, // Changed from top to bottom
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBanner: {
    backgroundColor: Colors.error,
  },
  connectedBanner: {
    backgroundColor: Colors.primary,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

