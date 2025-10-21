/**
 * ConnectionStatus Component
 * 
 * Displays a banner at the top of the screen when the app is offline or reconnecting.
 * Also processes the offline message queue when connection is restored.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useMessageStore } from '../stores/messageStore';
import { useNetworkStore } from '../stores/networkStore';

export const ConnectionStatus: React.FC = () => {
  const [slideAnim] = useState(new Animated.Value(-50));
  const { isConnected, setConnected } = useNetworkStore();
  const processOfflineQueue = useMessageStore((state) => state.processOfflineQueue);

  useEffect(() => {
    console.log('🔌 ConnectionStatus: Setting up NetInfo listener');
    
    // Fetch initial state
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? false;
      console.log('📶 Initial network status:', connected ? 'CONNECTED' : 'DISCONNECTED', 'Details:', state);
      setConnected(connected);
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      console.log('📶 Network status changed:', connected ? 'CONNECTED ✅' : 'DISCONNECTED ❌');
      console.log('📶 NetInfo details:', JSON.stringify(state, null, 2));
      
      // Check previous state from store
      const prevConnected = useNetworkStore.getState().isConnected;
      console.log('📶 Previous:', prevConnected, '→ New:', connected);
      
      // Update global network store
      setConnected(connected);
      
      // If reconnected, process offline queue
      if (connected && !prevConnected) {
        console.log('✅ Connection restored, processing offline queue');
        processOfflineQueue();
      }
    });

    return () => {
      console.log('🔌 ConnectionStatus: Cleaning up NetInfo listener');
      unsubscribe();
    };
  }, [processOfflineQueue, setConnected]);

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
    backgroundColor: '#FF6B6B',
  },
  connectedBanner: {
    backgroundColor: '#51CF66',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

