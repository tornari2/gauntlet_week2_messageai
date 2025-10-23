/**
 * Presence Service
 * 
 * Handles user online/offline status using Firebase Realtime Database
 * for reliable presence detection with automatic disconnect handling.
 * 
 * This service uses:
 * - Realtime Database for presence tracking with onDisconnect()
 * - Firestore for storing presence state (mirrored from RTDB)
 */

import {
  ref,
  onValue,
  onDisconnect,
  set,
  serverTimestamp as rtdbServerTimestamp,
  get,
} from 'firebase/database';
import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { database, firestore } from './firebase';

/**
 * Set up presence system for a user
 * This should be called when a user logs in
 * 
 * @param userId - The user's ID
 * @returns Cleanup function to call on logout
 */
export const setupPresence = (userId: string): (() => void) => {
  // Reference to user's presence in Realtime Database
  const userStatusDatabaseRef = ref(database, `/status/${userId}`);
  
  // Reference to user's document in Firestore
  const userStatusFirestoreRef = doc(firestore, 'users', userId);

  // Presence data
  const isOnlineData = {
    state: 'online',
    last_changed: rtdbServerTimestamp(),
  };

  const isOfflineData = {
    state: 'offline',
    last_changed: rtdbServerTimestamp(),
  };

  // Monitor connection state using the special .info/connected path
  const connectedRef = ref(database, '.info/connected');
  
  const unsubscribe = onValue(connectedRef, async (snapshot) => {
    const isConnected = snapshot.val();
    console.log(`[Presence] Connection state for ${userId}:`, isConnected);
    
    if (isConnected === false) {
      // Not connected to Firebase, do nothing
      // The onDisconnect handler will automatically run when we lose connection
      console.log(`[Presence] ${userId} disconnected, onDisconnect handler will fire`);
      return;
    }

    // We're connected (or reconnected)!
    console.log(`[Presence] ${userId} connected, setting up onDisconnect handler`);
    
    // Set up the onDisconnect handler
    // This will automatically set the user to offline when they disconnect
    await onDisconnect(userStatusDatabaseRef)
      .set(isOfflineData)
      .catch((error) => {
        console.error('❌ ERROR setting up onDisconnect:', error);
        console.error('❌ This likely means Realtime Database is not enabled or rules are incorrect');
      });

    // Also set up onDisconnect for Firestore mirror
    await onDisconnect(userStatusDatabaseRef)
      .set(isOfflineData);

    console.log(`[Presence] onDisconnect handler set for ${userId}`);

    // Now that we've set up the onDisconnect handler,
    // we can safely set our presence to online
    try {
      // Set online in Realtime Database
      await set(userStatusDatabaseRef, isOnlineData);
      console.log(`[Presence] ${userId} set to ONLINE in RTDB`);
      
      // Mirror to Firestore
      await setDoc(
        userStatusFirestoreRef,
        {
          isOnline: true,
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`[Presence] ${userId} mirrored to Firestore`);
    } catch (error) {
      console.error('❌ ERROR setting user online:', error);
    }
  });

  // Also listen to changes in the Realtime Database status
  // and mirror them to Firestore
  const statusUnsubscribe = onValue(userStatusDatabaseRef, async (snapshot) => {
    const status = snapshot.val();
    console.log(`[Presence] Status change for ${userId}:`, status);
    if (status) {
      try {
        await setDoc(
          userStatusFirestoreRef,
          {
            isOnline: status.state === 'online',
            lastSeen: serverTimestamp(),
          },
          { merge: true }
        );
        console.log(`[Presence] Mirrored ${userId} status to Firestore: ${status.state}`);
      } catch (error) {
        console.error('Error mirroring status to Firestore:', error);
      }
    } else {
      console.log(`[Presence] Status is null for ${userId}, user may have disconnected`);
    }
  });

  // Return cleanup function
  return () => {
    unsubscribe();
    statusUnsubscribe();
  };
};

/**
 * Explicitly set user offline
 * Call this when user logs out
 * 
 * @param userId - The user's ID
 */
export const setUserOffline = async (userId: string): Promise<void> => {
  const userStatusDatabaseRef = ref(database, `/status/${userId}`);
  const userStatusFirestoreRef = doc(firestore, 'users', userId);

  const isOfflineData = {
    state: 'offline',
    last_changed: rtdbServerTimestamp(),
  };

  try {
    // Set offline in Realtime Database
    await set(userStatusDatabaseRef, isOfflineData);
    
    // Mirror to Firestore
    await setDoc(
      userStatusFirestoreRef,
      {
        isOnline: false,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('❌ Error setting user offline:', error);
    throw error;
  }
};

/**
 * Manually update user's online status
 * Use this for app state changes (background/foreground)
 * 
 * @param userId - The user's ID
 * @param isOnline - Whether user is online
 */
export const updatePresence = async (
  userId: string,
  isOnline: boolean
): Promise<void> => {
  const userStatusDatabaseRef = ref(database, `/status/${userId}`);
  const userStatusFirestoreRef = doc(firestore, 'users', userId);

  const statusData = {
    state: isOnline ? 'online' : 'offline',
    last_changed: rtdbServerTimestamp(),
  };

  try {
    // Update in Realtime Database
    await set(userStatusDatabaseRef, statusData);
    
    // Mirror to Firestore
    await setDoc(
      userStatusFirestoreRef,
      {
        isOnline,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating presence:', error);
    throw error;
  }
};

/**
 * Get user's current presence status
 * 
 * @param userId - The user's ID
 * @returns Object with state and last_changed timestamp
 */
export const getUserPresence = async (
  userId: string
): Promise<{ state: string; last_changed: any } | null> => {
  try {
    const userStatusDatabaseRef = ref(database, `/status/${userId}`);
    const snapshot = await get(userStatusDatabaseRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user presence:', error);
    return null;
  }
};

