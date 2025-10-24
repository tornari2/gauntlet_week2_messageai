/**
 * Firebase Configuration and Initialization
 * 
 * This file initializes Firebase services (Auth, Firestore) for the app.
 * Configuration values are loaded from environment variables.
 */

import { Platform } from 'react-native';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, Database, connectDatabaseEmulator } from 'firebase/database';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';

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
let functions: Functions;

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

  // Initialize Firebase Functions (used for AI operations)
  functions = getFunctions(firebaseApp);

  // Connect to emulators in development
  // Set USE_FIREBASE_EMULATOR=true in your .env to enable emulator mode
  const useEmulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  
  console.log('🔍 EMULATOR CHECK:', {
    envVar: process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR,
    useEmulator: useEmulator,
  });
  
  if (useEmulator) {
    console.log('🔧 Using Firebase Emulators (localhost)');
    
    // Using Mac's actual IP address so iOS simulator can reach it
    const emulatorHost = '10.0.0.240';
    
    console.log(`📡 Connecting to Functions emulator at: ${emulatorHost}:5001`);
    
    // NOTE: We DON'T connect Auth to emulator - use production auth with local functions
    // This lets you use your real user account while testing functions locally
    
    // Connect Functions to emulator ONLY
    connectFunctionsEmulator(functions, emulatorHost, 5001);
    console.log(`⚡ Functions emulator connected to ${emulatorHost}:5001`);
    console.log(`🔐 Auth using PRODUCTION (not emulator)`);
    
    // Optionally connect other services to emulators
    // connectFirestoreEmulator(firestore, 'localhost', 8080);
    // connectDatabaseEmulator(database, 'localhost', 9000);
    // connectStorageEmulator(storage, 'localhost', 9199);
  } else {
    console.log('☁️ Using PRODUCTION Firebase');
  }

  console.log('Firebase initialized successfully with automatic offline persistence');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Export Firebase instances
export { firebaseApp, auth, firestore, database, storage, functions };

// Export Firebase for testing purposes
export const getFirebaseApp = (): FirebaseApp => firebaseApp;
export const getFirebaseAuth = (): Auth => auth;
export const getFirebaseFirestore = (): Firestore => firestore;
export const getFirebaseDatabase = (): Database => database;
export const getFirebaseStorage = (): FirebaseStorage => storage;
export const getFirebaseFunctions = (): Functions => functions;

