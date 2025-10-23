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
    
    set({ isInitialized: true });
    
    // Note: Network state is now managed by ConnectionStatus component
    // which calls setConnected() to update this store
  },
}));

