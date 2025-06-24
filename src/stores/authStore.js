/**
 * @file authStore.js
 * @description Zustand store for authentication state management in SnapConnect.
 * Handles user authentication, session management, and user profile data.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - zustand: State management
 * - @react-native-firebase/auth: Firebase authentication
 * 
 * @usage
 * import { useAuthStore } from '@/stores/authStore';
 * 
 * @ai_context
 * Integrates with AI services for user behavior tracking and personalization.
 * Supports gaming profile synchronization and preference learning.
 */

import { auth } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Authentication store with persistent state
 * 
 * @typedef {Object} AuthState
 * @property {Object|null} user - Current user object
 * @property {boolean} isAuthenticated - Authentication status
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Error message
 * @property {Object} preferences - User preferences
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Authentication state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // User preferences
      preferences: {
        theme: 'cyber',
        gamingPlatform: null,
        notifications: true,
        privacy: 'friends',
      },

      /**
       * Sign in with email and password
       * @param {string} email - User email
       * @param {string} password - User password
       * @returns {Promise<void>}
       */
      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const userCredential = await auth().signInWithEmailAndPassword(email, password);
          const user = userCredential.user;
          
          set({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified,
              createdAt: user.metadata.creationTime,
            },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          console.log('User signed in successfully:', user.email);
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error('Sign in failed:', error.message);
          throw error;
        }
      },

      /**
       * Sign up with email and password
       * @param {string} email - User email
       * @param {string} password - User password
       * @param {string} displayName - User display name
       * @returns {Promise<void>}
       */
      signUp: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        
        try {
          const userCredential = await auth().createUserWithEmailAndPassword(email, password);
          const user = userCredential.user;
          
          // Update user profile
          await user.updateProfile({ displayName });
          
          set({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified,
              createdAt: user.metadata.creationTime,
            },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          console.log('User signed up successfully:', email);
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error('Sign up failed:', error.message);
          throw error;
        }
      },

      /**
       * Sign out current user
       * @returns {Promise<void>}
       */
      signOut: async () => {
        set({ isLoading: true });
        
        try {
          await auth().signOut();
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          
          console.log('User signed out successfully');
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error('Sign out failed:', error.message);
          throw error;
        }
      },

      /**
       * Update user preferences
       * @param {Object} newPreferences - New preference values
       * @returns {void}
       */
      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
          },
        }));
      },

      /**
       * Clear authentication error
       * @returns {void}
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Initialize authentication listener
       * @returns {function} Unsubscribe function
       */
      initializeAuth: () => {
        return auth().onAuthStateChanged((user) => {
          if (user) {
            set({
              user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
                createdAt: user.metadata.creationTime,
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        // Don't persist sensitive authentication data
      }),
    }
  )
);

/**
 * Selector hooks for specific auth state
 */
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useUserPreferences = () => useAuthStore((state) => state.preferences); 
