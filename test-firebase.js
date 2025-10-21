// Simple test to verify Firebase initialization works
// Run with: node test-firebase.js

const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

// Load env vars
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log('Testing Firebase initialization...\n');

try {
  console.log('1. Initializing Firebase app...');
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized');

  console.log('\n2. Getting Auth instance...');
  const auth = getAuth(app);
  console.log('✅ Auth initialized:', auth ? 'SUCCESS' : 'FAILED');

  console.log('\n3. Getting Firestore instance...');
  const firestore = getFirestore(app);
  console.log('✅ Firestore initialized:', firestore ? 'SUCCESS' : 'FAILED');

  console.log('\n🎉 All Firebase services initialized successfully!');
  console.log('Firebase version:', require('firebase/package.json').version);
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Firebase initialization failed:');
  console.error(error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}

