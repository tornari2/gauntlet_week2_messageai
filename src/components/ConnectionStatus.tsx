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
import i18n from '../i18n';

// Test internet connectivity by attempting to reach a reliable endpoint
const testInternetConnectivity = async (): Promise<boolean> => {
  try {
    // Try to reach Google's public DNS (very reliable)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 204;
  } catch (error) {
    return false;
  }
};

export const ConnectionStatus: React.FC = () => {
  const [slideAnim] = useState(new Animated.Value(50)); // Start hidden below screen
  const isConnected = useNetworkStore((state) => state.isConnected);
  const processOfflineQueue = useMessageStore((state) => state.processOfflineQueue);
  
  // Get setConnected directly from store to ensure logging works
  const setConnected = useNetworkStore.getState().setConnected;
  
  // Log on every render to debug state issues
  console.log('[ConnectionStatus] 🎬 RENDER - isConnected:', isConnected, 'store:', useNetworkStore.getState().isConnected);
  
  // Use refs to avoid re-renders when these callbacks change
  const processOfflineQueueRef = useRef(processOfflineQueue);
  
  // Keep refs up to date
  useEffect(() => {
    processOfflineQueueRef.current = processOfflineQueue;
  }, [processOfflineQueue]);

  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch().then(async (state) => {
      // Be STRICT: Only consider connected if we have confirmed internet reachability
      // Treat null (unknown) as offline to handle simulator WiFi toggling
      let connected = state.isConnected === true && state.isInternetReachable === true;
      
      // If NetInfo says we're connected but isInternetReachable is null, test actual connectivity
      if (state.isConnected === true && state.isInternetReachable === null) {
        console.log('[ConnectionStatus] NetInfo uncertain, testing actual connectivity...');
        connected = await testInternetConnectivity();
        console.log('[ConnectionStatus] Actual connectivity test result:', connected);
      }
      
      console.log('[ConnectionStatus] Initial network state:', { 
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        computed: connected 
      });
      setConnected(connected);
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      try {
        console.log('[ConnectionStatus] 🔵 NetInfo event fired, processing...');
        console.log('[ConnectionStatus] Raw NetInfo state:', JSON.stringify(state, null, 2));
        
        // Be STRICT: Only consider connected if we have confirmed internet reachability
        // Treat null (unknown) as offline to handle simulator WiFi toggling  
        let connected = state.isConnected === true && state.isInternetReachable === true;
        
        // If NetInfo says we're NOT connected, we're definitely offline
        if (state.isConnected === false) {
          console.log('[ConnectionStatus] NetInfo says isConnected=false, definitely offline');
          connected = false;
        }
        // If NetInfo says we ARE connected, we need to verify with actual connectivity test
        else if (state.isConnected === true) {
          // Always test connectivity when NetInfo reports connected to handle simulator WiFi toggling
          console.log('[ConnectionStatus] NetInfo says connected, testing actual connectivity...');
          const actuallyConnected = await testInternetConnectivity();
          console.log('[ConnectionStatus] Actual connectivity test result:', actuallyConnected);
          connected = actuallyConnected;
        }
        
        console.log('[ConnectionStatus] Network state changed:', { 
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
          computed: connected 
        });
        
        // Check previous state from store
        const prevConnected = useNetworkStore.getState().isConnected;
        console.log('[ConnectionStatus] Previous connected state:', prevConnected);
        console.log('[ConnectionStatus] New connected state:', connected);
        console.log('[ConnectionStatus] State transition:', prevConnected, '→', connected);
        
        // Update global network store - call the function directly!
        setConnected(connected);
        console.log('[ConnectionStatus] Updated store to:', connected);
        console.log('[ConnectionStatus] Verifying store update:', useNetworkStore.getState().isConnected);
        
        // If reconnected, process offline queue to clean up temp messages
        if (connected && !prevConnected) {
          console.log('[ConnectionStatus] 🎉 Reconnected! Processing offline queue in 3 seconds...');
          console.log('[ConnectionStatus] 🎉🎉🎉 RECONNECTION DETECTED VIA NetInfo EVENT 🎉🎉🎉');
          // Wait 3 seconds to allow Firestore to fully reconnect
          // This delay is the same regardless of how you went offline/online
          setTimeout(() => {
            console.log('[ConnectionStatus] 🔄 Now processing offline queue...');
            processOfflineQueueRef.current();
          }, 3000);
        } else if (!connected && prevConnected) {
          console.log('[ConnectionStatus] 📴 WENT OFFLINE VIA NetInfo EVENT 📴');
        } else {
          console.log('[ConnectionStatus] No state change (connected:', connected, ', prevConnected:', prevConnected, ')');
        }
        
        console.log('[ConnectionStatus] ✅ NetInfo event processed successfully');
      } catch (error) {
        console.error('[ConnectionStatus] ❌ ERROR in NetInfo listener:', error);
      }
    });

    // Poll network state ALWAYS (not just when offline) to catch state changes faster
    // This improves detection speed for all offline methods, especially WiFi toggles
    // which don't always trigger NetInfo events (particularly on simulators)
    const pollInterval = setInterval(async () => {
      const currentState = useNetworkStore.getState().isConnected;
      
      try {
        const state = await NetInfo.fetch();
        
        // Be STRICT: Only consider connected if we have confirmed internet reachability
        // Treat null (unknown) as offline to handle simulator WiFi toggling
        let connected = state.isConnected === true && state.isInternetReachable === true;
        
        // If NetInfo says we're NOT connected, we're definitely offline
        if (state.isConnected === false) {
          connected = false;
        }
        // If NetInfo says we ARE connected, we ALWAYS test actual connectivity
        // This is critical for WiFi toggle detection on simulators
        else if (state.isConnected === true) {
          const actuallyConnected = await testInternetConnectivity();
          connected = actuallyConnected;
        }
        
        // Polling logs disabled to reduce console noise
        // console.log('[ConnectionStatus] Poll result:', {
        //   isConnected: state.isConnected,
        //   isInternetReachable: state.isInternetReachable,
        //   type: state.type,
        //   computed: connected,
        //   previous: currentState,
        //   tested: state.isConnected === true
        // });
        
        // If state changed, update it
        if (connected !== currentState) {
          console.log('[ConnectionStatus] 📡 Poll detected state change!', currentState, '→', connected);
          console.log('[ConnectionStatus] 📡📡📡 STATE CHANGE DETECTED IN POLL 📡📡📡');
          setConnected(connected);
          console.log('[ConnectionStatus] Verifying store update:', useNetworkStore.getState().isConnected);
          
          // If reconnected, process offline queue (same behavior for all reconnection methods)
          if (connected && !currentState) {
            console.log('[ConnectionStatus] 🎉 Reconnected via polling! Processing offline queue in 3 seconds...');
            console.log('[ConnectionStatus] 🎉🎉🎉 RECONNECTION DETECTED VIA POLLING 🎉🎉🎉');
            setTimeout(() => {
              console.log('[ConnectionStatus] 🔄 Now processing offline queue...');
              processOfflineQueueRef.current();
            }, 3000);
          } else if (!connected && currentState) {
            console.log('[ConnectionStatus] 📴 WENT OFFLINE VIA POLLING 📴');
          }
        } else {
          // Uncomment for debugging: console.log('[ConnectionStatus] No state change detected in poll');
        }
      } catch (error) {
        console.error('[ConnectionStatus] Error polling network state:', error);
      }
    }, 1500); // Poll every 1.5 seconds for faster detection

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
    // Empty dependency array - only set up once on mount
  }, []); // setConnected is stable, no dependencies needed

  useEffect(() => {
    // Animate banner in/out based on connection status
    console.log('[ConnectionStatus] ⚡ Animation effect triggered, isConnected:', isConnected);
    console.log('[ConnectionStatus] ⚡ Current slideAnim value before animation:', slideAnim);
    console.log('[ConnectionStatus] ⚡ Will animate to:', isConnected ? 50 : 0, '(50=hidden, 0=visible)');
    
    Animated.timing(slideAnim, {
      toValue: isConnected ? 50 : 0, // Slide down when offline, hide when connected
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      console.log('[ConnectionStatus] ✅ Animation completed, banner is now:', isConnected ? 'hidden' : 'visible');
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
          {isConnected ? i18n.t('connection.online') : i18n.t('connection.offline')}
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

