/**
 * ConnectionStatus Component
 * 
 * Displays a banner at the top of the screen when the app is offline or reconnecting.
 * Also processes the offline message queue when connection is restored.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useMessageStore } from '../stores/messageStore';
import { useNetworkStore } from '../stores/networkStore';
import { Colors } from '../constants/Colors';

export const ConnectionStatus: React.FC = () => {
  const [slideAnim] = useState(new Animated.Value(-50));
  const { isConnected, setConnected } = useNetworkStore();
  const processOfflineQueue = useMessageStore((state) => state.processOfflineQueue);
  
  // Use refs to avoid re-renders when these callbacks change
  const processOfflineQueueRef = useRef(processOfflineQueue);
  const setConnectedRef = useRef(setConnected);
  
  // Keep refs up to date
  useEffect(() => {
    processOfflineQueueRef.current = processOfflineQueue;
    setConnectedRef.current = setConnected;
  }, [processOfflineQueue, setConnected]);

  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? false;
      setConnectedRef.current(connected);
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      
      // Check previous state from store
      const prevConnected = useNetworkStore.getState().isConnected;
      
      // Update global network store
      setConnectedRef.current(connected);
      
      // If reconnected, process offline queue
      if (connected && !prevConnected) {
        processOfflineQueueRef.current();
        // Firestore subscriptions will automatically reconnect and update
      }
    });

    return () => {
      unsubscribe();
    };
    // Empty dependency array - only set up once on mount
  }, []);

  useEffect(() => {
    // Animate banner in/out based on connection status
    Animated.timing(slideAnim, {
      toValue: isConnected ? -50 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
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
    top: 0,
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

