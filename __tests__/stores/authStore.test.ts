/**
 * Auth Store Tests
 * Tests for Zustand authentication store
 */

import { useAuthStore } from '../../src/stores/authStore';
import * as authService from '../../src/services/authService';

// Mock the auth service
jest.mock('../../src/services/authService');

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      loading: true,
      error: null,
      initialized: false,
    });
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with null user', () => {
      const { user } = useAuthStore.getState();
      expect(user).toBeNull();
    });

    it('should initialize with loading true', () => {
      const { loading } = useAuthStore.getState();
      expect(loading).toBe(true);
    });

    it('should initialize with no error', () => {
      const { error } = useAuthStore.getState();
      expect(error).toBeNull();
    });

    it('should initialize as not initialized', () => {
      const { initialized } = useAuthStore.getState();
      expect(initialized).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should update user state', () => {
      const mockUser = {
        uid: '123',
        email: 'test@test.com',
        displayName: 'Test User',
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
      };

      useAuthStore.getState().setUser(mockUser);

      const { user } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
    });

    it('should set user to null', () => {
      useAuthStore.getState().setUser(null);

      const { user } = useAuthStore.getState();
      expect(user).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      useAuthStore.getState().setLoading(false);

      const { loading } = useAuthStore.getState();
      expect(loading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should update error state', () => {
      const mockError = new Error('Test error');
      useAuthStore.getState().setError(mockError);

      const { error } = useAuthStore.getState();
      expect(error).toEqual(mockError);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const mockError = new Error('Test error');
      useAuthStore.setState({ error: mockError });

      useAuthStore.getState().clearError();

      const { error } = useAuthStore.getState();
      expect(error).toBeNull();
    });
  });

  describe('login', () => {
    it('should call authService.signIn and update user', async () => {
      const mockUser = {
        uid: '123',
        email: 'test@test.com',
        displayName: 'Test User',
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
      };

      mockAuthService.signIn.mockResolvedValue(mockUser);

      await useAuthStore.getState().login('test@test.com', 'password123');

      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        'test@test.com',
        'password123'
      );
      
      const { user, loading } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(loading).toBe(false);
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      mockAuthService.signIn.mockRejectedValue(mockError);

      await expect(
        useAuthStore.getState().login('test@test.com', 'wrong')
      ).rejects.toThrow('Invalid credentials');

      const { error, loading } = useAuthStore.getState();
      expect(error).toEqual(mockError);
      expect(loading).toBe(false);
    });
  });

  describe('signup', () => {
    it('should call authService.signUp and update user', async () => {
      const mockUser = {
        uid: '123',
        email: 'test@test.com',
        displayName: 'Test User',
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
      };

      mockAuthService.signUp.mockResolvedValue(mockUser);

      await useAuthStore
        .getState()
        .signup('test@test.com', 'password123', 'Test User');

      expect(mockAuthService.signUp).toHaveBeenCalledWith(
        'test@test.com',
        'password123',
        'Test User'
      );

      const { user, loading } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(loading).toBe(false);
    });

    it('should handle signup error', async () => {
      const mockError = new Error('Email already in use');
      mockAuthService.signUp.mockRejectedValue(mockError);

      await expect(
        useAuthStore.getState().signup('test@test.com', 'pass', 'Test')
      ).rejects.toThrow('Email already in use');

      const { error, loading } = useAuthStore.getState();
      expect(error).toEqual(mockError);
      expect(loading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call authService.signOut and clear user', async () => {
      // Set initial user
      useAuthStore.setState({
        user: {
          uid: '123',
          email: 'test@test.com',
          displayName: 'Test User',
          isOnline: true,
          lastSeen: new Date(),
          createdAt: new Date(),
        },
      });

      mockAuthService.signOut.mockResolvedValue();

      await useAuthStore.getState().logout();

      expect(mockAuthService.signOut).toHaveBeenCalled();

      const { user, loading } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(loading).toBe(false);
    });

    it('should handle logout error', async () => {
      const mockError = new Error('Logout failed');
      mockAuthService.signOut.mockRejectedValue(mockError);

      await expect(useAuthStore.getState().logout()).rejects.toThrow(
        'Logout failed'
      );

      const { error, loading } = useAuthStore.getState();
      expect(error).toEqual(mockError);
      expect(loading).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should set up auth state listener', async () => {
      const mockUnsubscribe = jest.fn();
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        // Simulate auth state change
        callback(null);
        return mockUnsubscribe;
      });

      await useAuthStore.getState().initialize();

      expect(mockAuthService.onAuthStateChange).toHaveBeenCalled();

      const { initialized, loading } = useAuthStore.getState();
      expect(initialized).toBe(true);
      expect(loading).toBe(false);
    });
  });
});

