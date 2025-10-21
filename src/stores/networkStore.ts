/**
 * Network Store
 * 
 * Manages network connectivity state globally using Zustand.
 * This allows other stores and components to check if the device is online.
 */

import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean;
  isInitialized: boolean;
}

interface NetworkActions {
  setConnected: (connected: boolean) => void;
  initialize: () => void;
}

export const useNetworkStore = create<NetworkState & NetworkActions>((set, get) => ({
  isConnected: true, // Assume online initially
  isInitialized: false,
  
  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },
  
  initialize: () => {
    if (get().isInitialized) {
      return;
    }
    
    console.log('🌐 Initializing network store');
    
    // Fetch initial state
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? true;
      console.log('🌐 Initial network state:', connected);
      set({ isConnected: connected, isInitialized: true });
    });
    
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      console.log('🌐 Network state changed:', connected ? 'ONLINE' : 'OFFLINE');
      set({ isConnected: connected });
    });
    
    set({ isInitialized: true });
    
    // Note: In a real app, you'd want to clean this up, but for a global store
    // that exists for the app lifetime, we can let it persist
  },
}));

