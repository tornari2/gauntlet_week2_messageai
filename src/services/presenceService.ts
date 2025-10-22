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
 * Uses a heartbeat system for faster offline detection:
 * - Updates lastActive timestamp every 5 seconds
 * - Users are considered offline if lastActive > 15 seconds old
 * - More reliable than onDisconnect for force-killed apps
 * 
 * @param userId - The user's ID
 * @returns Cleanup function to call on logout
 */
export const setupPresence = (userId: string): (() => void) => {
  console.log('🔌 Setting up presence system for user:', userId);
  
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

  // Heartbeat interval - update lastActive every 5 seconds
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const updateHeartbeat = async () => {
    try {
      await setDoc(
        userStatusFirestoreRef,
        {
          isOnline: true,
          lastActive: serverTimestamp(),
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('❌ Error updating heartbeat:', error);
    }
  };

  // Monitor connection state using the special .info/connected path
  const connectedRef = ref(database, '.info/connected');
  console.log('🔌 Monitoring Firebase Realtime Database connection...');
  
  const unsubscribe = onValue(connectedRef, async (snapshot) => {
    const isConnected = snapshot.val();
    console.log('🔌 Firebase RTDB connection status:', isConnected ? 'CONNECTED ✅' : 'DISCONNECTED ❌');
    
    if (isConnected === false) {
      // Not connected to Firebase, stop heartbeat
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      console.log('⚠️ Not connected to Firebase RTDB - waiting for connection...');
      return;
    }

    // We're connected (or reconnected)!
    console.log('✅ Connected to Firebase RTDB! Setting up onDisconnect handler...');
    
    // Set up the onDisconnect handler
    // This will automatically set the user to offline when they disconnect
    await onDisconnect(userStatusDatabaseRef)
      .set(isOfflineData)
      .then(() => {
        console.log('✅ onDisconnect handler successfully set up for user:', userId);
      })
      .catch((error) => {
        console.error('❌ ERROR setting up onDisconnect:', error);
        console.error('❌ This likely means Realtime Database is not enabled or rules are incorrect');
      });

    // Also set up onDisconnect for Firestore mirror
    await onDisconnect(userStatusDatabaseRef)
      .set(isOfflineData);

    // Now that we've set up the onDisconnect handler,
    // we can safely set our presence to online
    try {
      console.log('⏳ Setting user presence to ONLINE in RTDB...');
      // Set online in Realtime Database
      await set(userStatusDatabaseRef, isOnlineData);
      console.log('✅ User set to ONLINE in RTDB');
      
      // Mirror to Firestore with lastActive timestamp
      console.log('⏳ Mirroring presence to Firestore...');
      await setDoc(
        userStatusFirestoreRef,
        {
          isOnline: true,
          lastActive: serverTimestamp(),
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('✅ User presence set to ONLINE in Firestore');
      
      // Start heartbeat - update lastActive every 5 seconds
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      heartbeatInterval = setInterval(updateHeartbeat, 5000);
      console.log('💓 Heartbeat started (5 second interval)');
      
      console.log('🎉 Presence system fully active for user:', userId);
    } catch (error) {
      console.error('❌ ERROR setting user online:', error);
      console.error('❌ Error details:', error);
    }
  });

  // Also listen to changes in the Realtime Database status
  // and mirror them to Firestore
  const statusUnsubscribe = onValue(userStatusDatabaseRef, async (snapshot) => {
    const status = snapshot.val();
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
      } catch (error) {
        console.error('Error mirroring status to Firestore:', error);
      }
    }
  });

  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up presence system for user:', userId);
    unsubscribe();
    statusUnsubscribe();
    // Stop heartbeat
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      console.log('💓 Heartbeat stopped');
    }
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
    console.log('📴 setUserOffline called for user:', userId);
    
    // Set offline in Realtime Database
    console.log('⏳ Updating Realtime Database...');
    await set(userStatusDatabaseRef, isOfflineData);
    console.log('✅ Realtime Database updated');
    
    // Mirror to Firestore
    console.log('⏳ Updating Firestore...');
    await setDoc(
      userStatusFirestoreRef,
      {
        isOnline: false,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
    console.log('✅ Firestore updated - User presence set to offline:', userId);
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
    
    console.log(`User presence updated to ${isOnline ? 'online' : 'offline'}:`, userId);
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

