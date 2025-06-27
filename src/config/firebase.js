/**
 * @file firebase.js
 * @description Firebase configuration and initialization for SnapConnect using Firebase compat mode.
 * Uses compatibility layer for better React Native support and stability.
 *
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-24
 *
 * @dependencies
 * - firebase: Firebase v9+ Compat SDK
 * - @react-native-async-storage/async-storage: For Auth persistence
 *
 * @usage
 * import { getFirebaseAuth, getFirebaseDB, getFirebaseStorage, initializeFirebaseServices } from '@/config/firebase';
 *
 * @ai_context
 * Integrates with AI services for user behavior analytics and personalization.
 * Supports real-time data synchronization for AI-powered features.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/functions";
import "firebase/compat/storage";

// Import v9 modular SDK for Functions (more reliable)
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

/**
 * Validate that all required Firebase environment variables are set
 * @throws {Error} If any required environment variable is missing
 */
function validateFirebaseConfig() {
  const requiredVars = [
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "EXPO_PUBLIC_FIREBASE_APP_ID",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `❌ Missing required Firebase environment variables: ${missingVars.join(", ")}\n` +
        "Please check your .env file and ensure all Firebase configuration variables are set.",
    );
  }
}

/**
 * Firebase configuration object for different environments
 * Configuration loaded from environment variables for security
 */
const firebaseConfig = {
  development: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },
  staging: {
    // TODO: Set up staging environment with separate Firebase project
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },
  production: {
    // TODO: Set up production environment with separate Firebase project
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },
};

/**
 * Get the current environment
 * @returns {string} Current environment (development, staging, production)
 */
function getCurrentEnvironment() {
  // Check if running in React Native environment
  if (typeof __DEV__ !== "undefined") {
    return __DEV__ ? "development" : "production";
  }

  // Fallback for Node.js environment
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/**
 * Initialize Firebase services
 * Must be called before using any Firebase services
 * @returns {Promise<void>}
 */
export const initializeFirebaseServices = async () => {
  try {
    // Validate environment variables before initialization
    validateFirebaseConfig();

    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
      const environment = getCurrentEnvironment();
      const config = firebaseConfig[environment];

      // Initialize Firebase app
      firebase.initializeApp(config);

      // DO NOT initialize Functions at startup - they should be lazy-loaded
      console.log("✅ Firebase app initialized (Functions will be initialized when needed)");
    }

    // Configure Auth persistence for React Native
    try {
      // Check if we're in React Native environment
      if (
        typeof navigator !== "undefined" &&
        navigator.product === "ReactNative"
      ) {
        // React Native automatically handles auth persistence with AsyncStorage
        // No need to explicitly set persistence - Firebase handles this internally
      } else {
        // For web platforms, use localStorage persistence
        await firebase
          .auth()
          .setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      }
    } catch (persistenceError) {
      console.warn(
        "⚠️ Firebase Auth persistence configuration warning:",
        persistenceError.message,
      );
      // Continue without explicit persistence configuration
    }

    console.log("✅ Firebase core services initialized successfully");

  } catch (error) {
    console.error("❌ Firebase services initialization failed:", error);
    throw error;
  }
};

/**
 * Get Firebase Auth instance
 * @returns {object} Firebase Auth instance
 */
export const getFirebaseAuth = () => {
  if (!firebase.apps.length) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebaseServices() first.",
    );
  }
  return firebase.auth();
};

/**
 * Get Firestore instance
 * @returns {object} Firestore instance
 */
export const getFirebaseDB = () => {
  if (!firebase.apps.length) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebaseServices() first.",
    );
  }
  return firebase.firestore();
};

/**
 * Get Firebase Storage instance
 * @returns {object} Firebase Storage instance
 */
export const getFirebaseStorage = () => {
  if (!firebase.apps.length) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebaseServices() first.",
    );
  }
  return firebase.storage();
};

/**
 * Get Firebase Functions instance using v9 modular SDK (more reliable than compat)
 * This is lazy-loaded and will only initialize when first called
 * @returns {object} Firebase Functions instance
 */
export const getFirebaseFunctions = () => {
  if (!firebase.apps.length) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebaseServices() first.",
    );
  }
  
  try {
    // Use v9 modular SDK for Functions
    const app = getApp(); // Get the default Firebase app
    const functions = getFunctions(app);
    
    // For development, optionally connect to emulator
    const environment = getCurrentEnvironment();
    if (environment === "development") {
      console.log("🔧 Firebase Functions initialized for development");
      // Uncomment the next line if you want to use the Functions emulator
      // connectFunctionsEmulator(functions, "localhost", 5001);
    }
    
    return functions;
  } catch (error) {
    console.warn("⚠️ Firebase Functions not available:", error.message);
    throw new Error(`Firebase Functions not available: ${error.message}`);
  }
};

/**
 * Helper function to create a callable function using v9 modular SDK
 * This includes error handling for when Functions aren't available
 * @param {string} functionName - Name of the Cloud Function
 * @returns {Function} Callable function
 */
export const createCallableFunction = (functionName) => {
  try {
    const functions = getFirebaseFunctions();
    return httpsCallable(functions, functionName);
  } catch (error) {
    console.warn("⚠️ Failed to create callable function:", error.message);
    // Return a mock function that throws a helpful error
    return async () => {
      throw new Error(`Firebase Functions not available. The function '${functionName}' cannot be called. Please ensure Firebase Functions are deployed and configured.`);
    };
  }
};

/**
 * Check if Firebase Functions are available
 * @returns {boolean} True if Functions are available
 */
export const areFirebaseFunctionsAvailable = () => {
  try {
    getFirebaseFunctions();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get Firebase App instance
 * @returns {object} Firebase App instance
 */
export const getFirebaseApp = () => {
  if (!firebase.apps.length) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebaseServices() first.",
    );
  }
  return firebase.app();
};

/**
 * Helper function to check if Firebase is initialized
 * @returns {boolean} True if Firebase is initialized
 */
export const isFirebaseInitialized = () => {
  return firebase.apps.length > 0;
};

/**
 * Verify AsyncStorage is available
 * @returns {Promise<boolean>} True if AsyncStorage is working
 */
export const verifyAsyncStorage = async () => {
  try {
    const testKey = "@snapconnect:storage_test";
    const testValue = "test";

    await AsyncStorage.setItem(testKey, testValue);
    const retrievedValue = await AsyncStorage.getItem(testKey);
    await AsyncStorage.removeItem(testKey);

    return retrievedValue === testValue;
  } catch (error) {
    console.error("AsyncStorage verification failed:", error);
    return false;
  }
};

// Export the firebase object for direct access when needed
export { firebase };

// Export the app as default
export default firebase;
