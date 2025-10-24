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
  collection,
  getDocs,
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
        photoURL: firebaseUser.photoURL || null,
        isOnline: data.isOnline || false,
        lastSeen: data.lastSeen || new Date(),
        pushToken: data.pushToken || null,
        createdAt: data.createdAt || new Date(),
      };
    } else {
      // If document doesn't exist, create it
      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || null,
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
      };
      
      await setDoc(userDocRef, {
        email: newUser.email,
        displayName: newUser.displayName,
        photoURL: newUser.photoURL || null,
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
      // Import dynamically to avoid circular dependencies
      const { setUserOffline } = await import('./presenceService');
      await setUserOffline(currentUser.uid);
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

/**
 * Get all users except the current user
 * Useful for creating new chats
 */
export const getAllUsers = async (currentUserId: string): Promise<User[]> => {
  try {
    const usersRef = collection(firestore, 'users');
    // Get all users - we'll filter out current user in memory
    const querySnapshot = await getDocs(usersRef);
    
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      // Skip the current user
      if (doc.id === currentUserId) {
        return;
      }
      
      const data = doc.data();
      users.push({
        uid: doc.id,
        email: data.email || '',
        displayName: data.displayName || '',
        photoURL: data.photoURL || null,
        isOnline: data.isOnline || false,
        lastSeen: data.lastSeen?.toDate ? data.lastSeen.toDate() : (data.lastSeen || new Date()),
        pushToken: data.pushToken || null,
        avatarColor: data.avatarColor, // Include avatar color
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      });
    });
    
    // Cache the loaded user profiles for offline access
    if (users.length > 0) {
      const { cacheUserProfiles } = await import('./storageService');
      await cacheUserProfiles(users);
      console.log(`✅ Cached ${users.length} user profiles for offline access`);
    }
    
    return users;
  } catch (error: any) {
    console.error('Error getting all users:', error);
    
    // If offline or network error, try to load from cache
    if (error?.code === 'unavailable' || 
        error?.message?.includes('offline') ||
        error?.message?.includes('network')) {
      console.log('📦 Network unavailable, loading users from cache');
      
      try {
        const { getCachedUserProfiles } = await import('./storageService');
        const cachedUsers = await getCachedUserProfiles();
        
        // Filter out current user from cached data
        const filteredUsers = cachedUsers.filter(user => user.uid !== currentUserId);
        
        console.log(`✅ Loaded ${filteredUsers.length} users from cache`);
        return filteredUsers;
      } catch (cacheError) {
        console.error('Error loading users from cache:', cacheError);
        return [];
      }
    }
    
    throw new AppError(
      'Failed to get users',
      ErrorCode.UNKNOWN,
      error as Error
    );
  }
};

/**
 * Update user's online status
 * Called when app is foregrounded/backgrounded
 */
export const updateOnlineStatus = async (
  userId: string,
  isOnline: boolean
): Promise<void> => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    await setDoc(
      userDocRef,
      {
        isOnline,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating online status:', error);
    throw new AppError(
      'Failed to update online status',
      ErrorCode.UNKNOWN,
      error as Error
    );
  }
};

/**
 * Get a specific user's data by ID
 * Useful for subscribing to presence updates
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: userId,
        email: data.email || '',
        displayName: data.displayName || '',
        photoURL: data.photoURL || null,
        isOnline: data.isOnline || false,
        lastSeen: data.lastSeen?.toDate() || new Date(),
        pushToken: data.pushToken || null,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw new AppError(
      'Failed to get user',
      ErrorCode.UNKNOWN,
      error as Error
    );
  }
};

/**
 * Update user's push notification token
 * @param userId - User ID
 * @param pushToken - Expo push token
 */
export const updatePushToken = async (
  userId: string,
  pushToken: string | null
): Promise<void> => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    await setDoc(
      userDocRef,
      {
        pushToken,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating push token:', error);
    throw new AppError(
      'Failed to update push token',
      ErrorCode.UNKNOWN,
      error as Error
    );
  }
};

