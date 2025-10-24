/**
 * Firebase Configuration and Initialization
 * 
 * This file initializes Firebase services (Auth, Firestore) for the app.
 * Configuration values are loaded from environment variables.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration from environment variables
// Use EXPO_PUBLIC_ prefix for Expo to expose them to the client
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: `https://${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
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
let database: Database;
let storage: FirebaseStorage;

try {
  // Initialize Firebase app
  firebaseApp = initializeApp(firebaseConfig);

  // Initialize Auth
  // NOTE: Firebase v12 with Expo/React Native has limited persistence support
  // AsyncStorage persistence configuration is not easily accessible due to module resolution issues
  // Users may need to log in again after force-closing the app
  // This is a known limitation with Firebase JS SDK in React Native environments
  auth = getAuth(firebaseApp);

  // Initialize Firestore
  // NOTE: Firestore automatically enables offline persistence in React Native
  // Data is cached locally and syncs when connection is restored
  // Our AsyncStorage layer in storageService.ts provides additional caching
  firestore = getFirestore(firebaseApp);

  // Initialize Realtime Database (used for presence system)
  database = getDatabase(firebaseApp);

  // Initialize Firebase Storage (used for image uploads)
  storage = getStorage(firebaseApp);

  console.log('Firebase initialized successfully with automatic offline persistence');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Export Firebase instances
export { firebaseApp, auth, firestore, database, storage };

// Export Firebase for testing purposes
export const getFirebaseApp = (): FirebaseApp => firebaseApp;
export const getFirebaseAuth = (): Auth => auth;
export const getFirebaseFirestore = (): Firestore => firestore;
export const getFirebaseDatabase = (): Database => database;
export const getFirebaseStorage = (): FirebaseStorage => storage;

