/**
 * Firebase Configuration Tests
 * Basic tests to ensure Firebase is initialized correctly
 */

// Mock environment variables before importing Firebase
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id';
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = 'test-app-id';

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ app: {} })),
  initializeAuth: jest.fn(() => ({ app: {} })),
  getReactNativePersistence: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ app: {} })),
  enableIndexedDbPersistence: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('Firebase Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize Firebase app', () => {
    const { initializeApp } = require('firebase/app');
    // Import firebase module to trigger initialization
    require('../../src/services/firebase');
    
    expect(initializeApp).toHaveBeenCalled();
  });

  it('should export auth instance', () => {
    const firebase = require('../../src/services/firebase');
    
    expect(firebase.auth).toBeDefined();
  });

  it('should export firestore instance', () => {
    const firebase = require('../../src/services/firebase');
    
    expect(firebase.firestore).toBeDefined();
  });

  it('should export firebaseApp instance', () => {
    const firebase = require('../../src/services/firebase');
    
    expect(firebase.firebaseApp).toBeDefined();
  });

  it('should have getter functions for testing', () => {
    const firebase = require('../../src/services/firebase');
    
    expect(typeof firebase.getFirebaseApp).toBe('function');
    expect(typeof firebase.getFirebaseAuth).toBe('function');
    expect(typeof firebase.getFirebaseFirestore).toBe('function');
  });
});

describe('Firebase Configuration Validation', () => {
  it('should validate that all required config keys are present', () => {
    // This test ensures configuration validation runs
    const firebase = require('../../src/services/firebase');
    
    // If we got here without errors, validation passed
    expect(firebase.firebaseApp).toBeDefined();
  });
});

