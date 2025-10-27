/**
 * Authentication Store (Zustand)
 * Manages global authentication state and actions
 */

import { create } from 'zustand';
import { User } from '../types';
import * as authService from '../services/authService';
import { useTranslationStore } from './translationStore';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
  initialized: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  user: null,
  loading: true, // Start with loading true until initialized
  error: null,
  initialized: false,

  // Actions
  setUser: (user) => set({ user }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  /**
   * Initialize auth state and set up listener
   */
  initialize: async () => {
    try {
      set({ loading: true });
      
      // Set up auth state listener
      await authService.onAuthStateChange(async (user) => {
        set({ 
          user, 
          loading: false, 
          initialized: true,
          error: null 
        });
        
        // Load user's language preference immediately after login
        if (user) {
          try {
            await useTranslationStore.getState().loadUserLanguage(user.uid);
          } catch (error) {
            console.error('Error loading user language on login:', error);
          }
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ 
        error: error as Error, 
        loading: false, 
        initialized: true 
      });
    }
  },

  /**
   * Login with email and password
   */
  login: async (email: string, password: string) => {
    try {
      // DON'T set global loading state - it causes AppNavigator to unmount the LoginScreen
      // The LoginScreen uses its own localLoading state
      set({ error: null });
      
      await authService.signIn(email, password);
      
      // Don't set user here - let onAuthStateChange handle it to avoid double render/flicker
      // The listener will fire immediately after successful sign in
    } catch (error) {
      // Don't log error here - it's handled in the UI
      set({ 
        error: error as Error
      });
      throw error; // Re-throw so UI can handle it
    }
  },

  /**
   * Sign up with email, password, and display name
   */
  signup: async (email: string, password: string, displayName: string) => {
    try {
      // DON'T set global loading state - it causes AppNavigator to unmount the SignupScreen
      // The SignupScreen uses its own localLoading state
      set({ error: null });
      
      await authService.signUp(email, password, displayName);
      
      // Don't set user here - let onAuthStateChange handle it to avoid double render/flicker
      // The listener will fire immediately after successful sign up
    } catch (error) {
      // Don't log error here - it's handled in the UI
      set({ 
        error: error as Error
      });
      throw error; // Re-throw so UI can handle it
    }
  },

  /**
   * Logout current user
   */
  logout: async () => {
    try {
      set({ loading: true, error: null });
      
      await authService.signOut();
      
      set({ user: null, loading: false });
    } catch (error) {
      console.error('Logout error:', error);
      set({ 
        error: error as Error, 
        loading: false 
      });
      throw error;
    }
  },
}));

