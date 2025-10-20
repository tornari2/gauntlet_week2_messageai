/**
 * Auth Service Tests
 * Tests for Firebase authentication service
 */

import * as authService from '../../src/services/authService';
import { auth, firestore } from '../../src/services/firebase';

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

// Import mocked modules
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

const mockCreateUser = createUserWithEmailAndPassword as jest.MockedFunction<
  typeof createUserWithEmailAndPassword
>;
const mockSignIn = signInWithEmailAndPassword as jest.MockedFunction<
  typeof signInWithEmailAndPassword
>;
const mockSignOut = firebaseSignOut as jest.MockedFunction<typeof firebaseSignOut>;
const mockUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;
const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<
  typeof onAuthStateChanged
>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should create user and Firestore document', async () => {
      const mockUser = {
        uid: '123',
        email: 'test@test.com',
        displayName: 'Test User',
      };

      mockCreateUser.mockResolvedValue({
        user: mockUser as any,
      } as any);
      mockUpdateProfile.mockResolvedValue(undefined);
      mockSetDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue({} as any);

      const result = await authService.signUp(
        'test@test.com',
        'password123',
        'Test User'
      );

      expect(mockCreateUser).toHaveBeenCalledWith(
        auth,
        'test@test.com',
        'password123'
      );
      expect(mockUpdateProfile).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalled();
      expect(result).toHaveProperty('uid', '123');
      expect(result).toHaveProperty('email', 'test@test.com');
      expect(result).toHaveProperty('displayName', 'Test User');
    });

    it('should handle email already in use error', async () => {
      const error = { code: 'auth/email-already-in-use' };
      mockCreateUser.mockRejectedValue(error);

      await expect(
        authService.signUp('test@test.com', 'password', 'Test')
      ).rejects.toThrow('Email already in use');
    });

    it('should handle invalid email error', async () => {
      const error = { code: 'auth/invalid-email' };
      mockCreateUser.mockRejectedValue(error);

      await expect(
        authService.signUp('invalid', 'password', 'Test')
      ).rejects.toThrow('Invalid email address');
    });

    it('should handle weak password error', async () => {
      const error = { code: 'auth/weak-password' };
      mockCreateUser.mockRejectedValue(error);

      await expect(
        authService.signUp('test@test.com', '123', 'Test')
      ).rejects.toThrow('Password is too weak');
    });
  });

  describe('signIn', () => {
    it('should sign in user and get Firestore data', async () => {
      const mockUser = {
        uid: '123',
        email: 'test@test.com',
        displayName: 'Test User',
      };

      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          email: 'test@test.com',
          displayName: 'Test User',
          isOnline: false,
          lastSeen: new Date(),
          createdAt: new Date(),
        }),
      };

      mockSignIn.mockResolvedValue({
        user: mockUser as any,
      } as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);
      mockSetDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue({} as any);

      const result = await authService.signIn('test@test.com', 'password123');

      expect(mockSignIn).toHaveBeenCalledWith(
        auth,
        'test@test.com',
        'password123'
      );
      expect(mockGetDoc).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalled(); // Updates online status
      expect(result).toHaveProperty('uid', '123');
      expect(result).toHaveProperty('isOnline', true);
    });

    it('should handle user not found error', async () => {
      const error = { code: 'auth/user-not-found' };
      mockSignIn.mockRejectedValue(error);

      await expect(
        authService.signIn('test@test.com', 'password')
      ).rejects.toThrow('User not found');
    });

    it('should handle wrong password error', async () => {
      const error = { code: 'auth/wrong-password' };
      mockSignIn.mockRejectedValue(error);

      await expect(
        authService.signIn('test@test.com', 'wrong')
      ).rejects.toThrow('Incorrect password');
    });

    it('should handle invalid email error', async () => {
      const error = { code: 'auth/invalid-email' };
      mockSignIn.mockRejectedValue(error);

      await expect(
        authService.signIn('invalid', 'password')
      ).rejects.toThrow('Invalid email address');
    });
  });

  describe('signOut', () => {
    it('should sign out user and update online status', async () => {
      const mockCurrentUser = {
        uid: '123',
      };

      (auth as any).currentUser = mockCurrentUser;
      mockSignOut.mockResolvedValue(undefined);
      mockSetDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue({} as any);

      await authService.signOut();

      expect(mockSetDoc).toHaveBeenCalled(); // Updates online status
      expect(mockSignOut).toHaveBeenCalledWith(auth);
    });

    it('should handle sign out error', async () => {
      const error = new Error('Sign out failed');
      mockSignOut.mockRejectedValue(error);

      await expect(authService.signOut()).rejects.toThrow('Failed to sign out');
    });
  });

  describe('onAuthStateChange', () => {
    it('should set up auth state listener', () => {
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const unsubscribe = authService.onAuthStateChange(callback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(
        auth,
        expect.any(Function)
      );
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback with null when user signs out', () => {
      const callback = jest.fn();

      mockOnAuthStateChanged.mockImplementation((auth, handler) => {
        // Simulate sign out
        handler(null);
        return jest.fn();
      });

      authService.onAuthStateChange(callback);

      expect(callback).toHaveBeenCalledWith(null);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const mockUser = { uid: '123', email: 'test@test.com' };
      (auth as any).currentUser = mockUser;

      const result = authService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when no user', () => {
      (auth as any).currentUser = null;

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});

