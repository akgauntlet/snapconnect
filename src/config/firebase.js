/**
 * @file firebase.js
 * @description Firebase configuration and initialization for SnapConnect using Firebase v9+ Web SDK.
 * Handles environment-specific configurations and service initialization for Expo compatibility.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - firebase: Firebase v9+ Web SDK
 * 
 * @usage
 * import { auth, database, storage } from '@/config/firebase';
 * 
 * @ai_context
 * Integrates with AI services for user behavior analytics and personalization.
 * Supports real-time data synchronization for AI-powered features.
 */

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

/**
 * Firebase configuration object for different environments
 * Using mock configuration for development - replace with real config when setting up Firebase project
 */
const firebaseConfig = {
  development: {
    apiKey: "mock-api-key-for-development",
    authDomain: "***REMOVED***",
    databaseURL: "https://snapconnect-dev-default-rtdb.firebaseio.com",
    projectId: "snapconnect-dev",
    storageBucket: "snapconnect-dev.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:mock-app-id-dev",
  },
  staging: {
    apiKey: "mock-api-key-for-staging",
    authDomain: "snapconnect-staging.firebaseapp.com",
    databaseURL: "https://snapconnect-staging-default-rtdb.firebaseio.com",
    projectId: "snapconnect-staging",
    storageBucket: "snapconnect-staging.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:mock-app-id-staging",
  },
  production: {
    apiKey: "mock-api-key-for-production",
    authDomain: "snapconnect.firebaseapp.com",
    databaseURL: "https://snapconnect-default-rtdb.firebaseio.com",
    projectId: "snapconnect",
    storageBucket: "snapconnect.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:mock-app-id-prod",
  },
};

/**
 * Get the current environment
 * @returns {string} Current environment (development, staging, production)
 */
function getCurrentEnvironment() {
  return __DEV__ ? 'development' : 'production';
}

/**
 * Initialize Firebase with environment-specific configuration
 * @returns {object} Firebase app instance
 */
export const initializeFirebase = () => {
  try {
    const environment = getCurrentEnvironment();
    const config = firebaseConfig[environment];
    
    // Check if Firebase is already initialized
    let app;
    if (getApps().length === 0) {
      app = initializeApp(config);
      console.log(`🔥 Firebase initialized for ${environment} environment (mock config)`);
    } else {
      app = getApp();
      console.log(`🔥 Firebase already initialized for ${environment} environment`);
    }
    
    return app;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    // Return a mock app for development
    return {
      name: '[DEFAULT]',
      options: firebaseConfig[getCurrentEnvironment()]
    };
  }
};

// Initialize Firebase
const app = initializeFirebase();

// Initialize Firebase services with error handling
let auth, database, storage;

try {
  auth = getAuth(app);
  database = getDatabase(app);
  storage = getStorage(app);
  console.log('✅ Firebase services initialized successfully');
} catch (error) {
  console.warn('⚠️ Firebase services initialization failed, using mock services:', error.message);
  
  // Create mock services for development
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      // Mock auth state - no user initially
      setTimeout(() => callback(null), 100);
      return () => {}; // unsubscribe function
    }
  };
  
  database = {
    ref: (path) => ({
      set: async (value) => console.log('Mock database set:', path, value),
      get: async () => ({ val: () => null, exists: () => false }),
      update: async (value) => console.log('Mock database update:', path, value),
      on: () => {},
      off: () => {}
    })
  };
  
  storage = {
    ref: (path) => ({
      put: async () => ({ ref: { getDownloadURL: async () => 'mock-url' } }),
      getDownloadURL: async () => 'mock-url',
      delete: async () => console.log('Mock storage delete:', path)
    })
  };
}

// Export services
export { auth, database, storage };

/**
 * Database reference helpers
 */
export const dbRefs = {
  users: () => database,
  messages: () => database,
  stories: () => database,
  gaming: () => database,
};

/**
 * Storage reference helpers
 */
export const storageRefs = {
  avatars: () => storage,
  messages: () => storage,
  stories: () => storage,
  gaming: () => storage,
};

export default app; 
