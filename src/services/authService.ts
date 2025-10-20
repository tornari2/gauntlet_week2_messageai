/**
 * Authentication Service
 * Handles Firebase Authentication operations and user document management
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { User, AppError, ErrorCode } from '../types';

/**
 * Convert Firebase User to our User type with Firestore data
 */
const getUserData = async (firebaseUser: FirebaseUser): Promise<User> => {
  try {
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || undefined,
        isOnline: data.isOnline || false,
        lastSeen: data.lastSeen || new Date(),
        pushToken: data.pushToken || undefined,
        createdAt: data.createdAt || new Date(),
      };
    } else {
      // If document doesn't exist, create it
      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || undefined,
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
      };
      
      await setDoc(userDocRef, {
        email: newUser.email,
        displayName: newUser.displayName,
        photoURL: newUser.photoURL,
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      return newUser;
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    throw new AppError(
      'Failed to get user data',
      ErrorCode.UNKNOWN,
      error as Error
    );
  }
};

/**
 * Sign up a new user with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update display name
    await updateProfile(userCredential.user, { displayName });

    // Create user document in Firestore
    const userDocRef = doc(firestore, 'users', userCredential.user.uid);
    await setDoc(userDocRef, {
      email,
      displayName,
      photoURL: null,
      isOnline: true,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      pushToken: null,
    });

    // Return user data
    return {
      uid: userCredential.user.uid,
      email,
      displayName,
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
    };
  } catch (error: any) {
    console.error('Signup error:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      throw new AppError(
        'Email already in use',
        ErrorCode.AUTH_EMAIL_IN_USE,
        error
      );
    } else if (error.code === 'auth/invalid-email') {
      throw new AppError(
        'Invalid email address',
        ErrorCode.AUTH_INVALID_EMAIL,
        error
      );
    } else if (error.code === 'auth/weak-password') {
      throw new AppError(
        'Password is too weak',
        ErrorCode.AUTH_WEAK_PASSWORD,
        error
      );
    } else {
      throw new AppError(
        'Failed to sign up',
        ErrorCode.UNKNOWN,
        error
      );
    }
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Get user data from Firestore
    const user = await getUserData(userCredential.user);

    // Update online status
    const userDocRef = doc(firestore, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        isOnline: true,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );

    return { ...user, isOnline: true };
  } catch (error: any) {
    console.error('Sign in error:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      throw new AppError(
        'User not found',
        ErrorCode.AUTH_USER_NOT_FOUND,
        error
      );
    } else if (error.code === 'auth/wrong-password') {
      throw new AppError(
        'Incorrect password',
        ErrorCode.AUTH_WRONG_PASSWORD,
        error
      );
    } else if (error.code === 'auth/invalid-email') {
      throw new AppError(
        'Invalid email address',
        ErrorCode.AUTH_INVALID_EMAIL,
        error
      );
    } else {
      throw new AppError(
        'Failed to sign in',
        ErrorCode.UNKNOWN,
        error
      );
    }
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      // Update online status before signing out
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(
        userDocRef,
        {
          isOnline: false,
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw new AppError(
      'Failed to sign out',
      ErrorCode.UNKNOWN,
      error as Error
    );
  }
};

/**
 * Listen to authentication state changes
 */
export const onAuthStateChange = (
  callback: (user: User | null) => void
): (() => void) => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const user = await getUserData(firebaseUser);
        callback(user);
      } catch (error) {
        console.error('Error in auth state change:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

/**
 * Get current user
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

