/**
 * Firebase Configuration and Initialization
 * 
 * This file initializes Firebase services (Auth, Firestore) for the app.
 * Configuration values are loaded from environment variables.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration from environment variables
// Use EXPO_PUBLIC_ prefix for Expo to expose them to the client
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate configuration
const validateConfig = (): void => {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingKeys = requiredKeys.filter(
    (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
  );

  if (missingKeys.length > 0) {
    console.error('Missing Firebase configuration keys:', missingKeys);
    throw new Error(
      `Firebase configuration incomplete. Missing: ${missingKeys.join(', ')}`
    );
  }
};

// Validate before initializing
validateConfig();

// Initialize Firebase
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

try {
  // Initialize Firebase app
  firebaseApp = initializeApp(firebaseConfig);

  // Initialize Auth with AsyncStorage persistence for React Native
  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  // Initialize Firestore
  firestore = getFirestore(firebaseApp);

  // Enable offline persistence for Firestore
  // This allows the app to work offline and sync when back online
  enableIndexedDbPersistence(firestore).catch((error) => {
    if (error.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (error.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('Firestore persistence not supported by browser');
    } else {
      console.error('Firestore persistence error:', error);
    }
  });

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Export Firebase instances
export { firebaseApp, auth, firestore };

// Export Firebase for testing purposes
export const getFirebaseApp = (): FirebaseApp => firebaseApp;
export const getFirebaseAuth = (): Auth => auth;
export const getFirebaseFirestore = (): Firestore => firestore;

