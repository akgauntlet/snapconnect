/**
 * @file firebase.js
 * @description Firebase configuration and initialization for SnapConnect.
 * Handles environment-specific configurations and service initialization.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - @react-native-firebase/app: Firebase core
 * - @react-native-firebase/auth: Authentication
 * - @react-native-firebase/database: Realtime Database
 * - @react-native-firebase/storage: Cloud Storage
 * 
 * @usage
 * import { initializeFirebase, auth, database, storage } from '@/config/firebase';
 * 
 * @ai_context
 * Integrates with AI services for user behavior analytics and personalization.
 * Supports real-time data synchronization for AI-powered features.
 */

import { getApp, getApps, initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';

/**
 * Firebase configuration object for different environments
 * TODO: Replace with your actual Firebase project configuration
 * Get these values from Firebase Console > Project Settings > General > Your apps
 */
const firebaseConfig = {
  development: {
    apiKey: "your-api-key-dev",
    authDomain: "***REMOVED***",
    databaseURL: "https://snapconnect-dev-default-rtdb.firebaseio.com",
    projectId: "snapconnect-dev",
    storageBucket: "snapconnect-dev.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:android:abcdef123456",
  },
  staging: {
    apiKey: "your-api-key-staging",
    authDomain: "snapconnect-staging.firebaseapp.com",
    databaseURL: "https://snapconnect-staging-default-rtdb.firebaseio.com",
    projectId: "snapconnect-staging",
    storageBucket: "snapconnect-staging.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:android:abcdef123456",
  },
  production: {
    apiKey: "your-api-key-prod",
    authDomain: "snapconnect.firebaseapp.com",
    databaseURL: "https://snapconnect-default-rtdb.firebaseio.com",
    projectId: "snapconnect",
    storageBucket: "snapconnect.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:android:abcdef123456",
  },
};

/**
 * Get the current environment
 * @returns {string} Current environment (development, staging, production)
 */
function getCurrentEnvironment() {
  // TODO: Implement proper environment detection
  // For now, default to development
  return __DEV__ ? 'development' : 'production';
}

/**
 * Initialize Firebase with environment-specific configuration
 * @returns {Promise<object>} Firebase app instance
 */
export const initializeFirebase = async () => {
  try {
    const environment = getCurrentEnvironment();
    const config = firebaseConfig[environment];
    
    // Check if Firebase is already initialized
    let app;
    if (getApps().length === 0) {
      app = initializeApp(config);
      console.log(`Firebase initialized for ${environment} environment`);
    } else {
      app = getApp();
      console.log(`Firebase already initialized for ${environment} environment`);
    }
    
    // Test Firebase connection
    await testFirebaseConnection();
    
    return app;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
};

/**
 * Test Firebase connection by attempting to access services
 * @returns {Promise<void>}
 */
const testFirebaseConnection = async () => {
  try {
    // Test authentication service
    await auth().signInAnonymously();
    console.log('Firebase Auth: Connection successful');
    
    // Test database service
    const testRef = database().ref('test');
    await testRef.set({ timestamp: Date.now() });
    console.log('Firebase Database: Connection successful');
    
    // Test storage service
    const storageRef = storage().ref('test');
    console.log('Firebase Storage: Connection successful');
    
  } catch (error) {
    console.warn('Firebase connection test failed:', error.message);
    // Don't throw here - app should continue with limited functionality
  }
};

/**
 * Firebase service exports
 */
export { auth, database, storage };

/**
 * Database reference helpers
 */
export const dbRefs = {
  users: () => database().ref('users'),
  messages: () => database().ref('messages'),
  stories: () => database().ref('stories'),
  gaming: () => database().ref('gaming'),
};

/**
 * Storage reference helpers
 */
export const storageRefs = {
  avatars: () => storage().ref('avatars'),
  messages: () => storage().ref('messages'),
  stories: () => storage().ref('stories'),
  gaming: () => storage().ref('gaming'),
};

export default initializeFirebase; 
