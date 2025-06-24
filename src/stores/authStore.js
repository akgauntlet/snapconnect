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
 * - authService: Firebase authentication service
 * 
 * @usage
 * import { useAuthStore } from '@/stores/authStore';
 * 
 * @ai_context
 * Integrates with AI services for user behavior tracking and personalization.
 * Supports gaming profile synchronization and preference learning.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authService } from '../services/firebase/authService';

/**
 * Authentication store with persistent state
 * 
 * @typedef {Object} AuthState
 * @property {Object|null} user - Current user object
 * @property {Object|null} profile - User profile from database
 * @property {boolean} isAuthenticated - Authentication status
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Error message
 * @property {Object} preferences - User preferences
 * @property {Object|null} phoneVerification - Phone verification state
 * @property {Function|null} authUnsubscribe - Auth state listener unsubscribe function
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Authentication state
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Phone verification state
      phoneVerification: null,
      
      // Auth listener unsubscribe function
      authUnsubscribe: null,
      
      // User preferences
      preferences: {
        theme: 'cyber',
        gamingPlatform: null,
        notifications: true,
        privacy: 'friends',
      },

      /**
       * Store auth unsubscribe function
       * @param {Function} unsubscribe - Unsubscribe function
       */
      setAuthUnsubscribe: (unsubscribe) => {
        set({ authUnsubscribe: unsubscribe });
      },

      /**
       * Sign in with email and password
       * @param {string} email - User email
       * @param {string} password - User password
       * @returns {Promise<void>}
       */
      signInWithEmail: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const { user, profile } = await authService.signInWithEmail(email, password);
          
          set({
            user,
            profile,
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
       * @param {Object} additionalData - Additional profile data
       * @returns {Promise<void>}
       */
      signUpWithEmail: async (email, password, displayName, additionalData = {}) => {
        set({ isLoading: true, error: null });
        
        try {
          const { user, profile } = await authService.signUpWithEmail(
            email, 
            password, 
            displayName, 
            additionalData
          );
          
          set({
            user,
            profile,
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
       * Start phone number authentication
       * @param {string} phoneNumber - Phone number in E.164 format
       * @returns {Promise<string>} Verification ID
       */
      signInWithPhoneNumber: async (phoneNumber) => {
        set({ isLoading: true, error: null });
        
        try {
          const { confirmation, verificationId } = await authService.signInWithPhoneNumber(phoneNumber);
          
          set({
            phoneVerification: {
              confirmation,
              verificationId,
              phoneNumber
            },
            isLoading: false,
            error: null,
          });
          
          console.log('Phone verification sent:', phoneNumber);
          return verificationId;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error('Phone sign in failed:', error.message);
          throw error;
        }
      },

      /**
       * Verify phone number with SMS code
       * @param {string} code - SMS verification code
       * @param {Object} additionalData - Additional profile data for new users
       * @returns {Promise<void>}
       */
      verifyPhoneNumber: async (code, additionalData = {}) => {
        const { phoneVerification } = get();
        
        if (!phoneVerification) {
          throw new Error('No phone verification in progress');
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const { user, profile, isNewUser } = await authService.verifyPhoneNumber(
            phoneVerification.verificationId,
            code,
            additionalData
          );
          
          set({
            user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            phoneVerification: null,
          });
          
          console.log('Phone verification successful:', user.phoneNumber);
          return { isNewUser };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error('Phone verification failed:', error.message);
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
          await authService.signOut();
          
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            phoneVerification: null,
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
       * Update user profile
       * @param {Object} updates - Profile updates
       * @returns {Promise<void>}
       */
      updateProfile: async (updates) => {
        const { user } = get();
        
        if (!user) {
          throw new Error('No authenticated user');
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const updatedProfile = await authService.updateUserProfile(user.uid, updates);
          
          set({
            profile: updatedProfile,
            isLoading: false,
            error: null,
          });
          
          console.log('Profile updated successfully');
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error('Profile update failed:', error.message);
          throw error;
        }
      },

      /**
       * Check username availability
       * @param {string} username - Username to check
       * @returns {Promise<boolean>} True if available
       */
      checkUsernameAvailability: async (username) => {
        try {
          return await authService.isUsernameAvailable(username);
        } catch (error) {
          console.error('Username check failed:', error.message);
          return false;
        }
      },

      /**
       * Reserve username for current user
       * @param {string} username - Username to reserve
       * @returns {Promise<void>}
       */
      reserveUsername: async (username) => {
        const { user } = get();
        
        if (!user) {
          throw new Error('No authenticated user');
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await authService.reserveUsername(user.uid, username);
          
          // Update local profile
          const updatedProfile = await authService.getUserProfile(user.uid);
          
          set({
            profile: updatedProfile,
            isLoading: false,
            error: null,
          });
          
          console.log('Username reserved successfully:', username);
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error('Username reservation failed:', error.message);
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
       * Clear phone verification state
       * @returns {void}
       */
      clearPhoneVerification: () => {
        set({ phoneVerification: null });
      },

      /**
       * Initialize authentication listener
       * Must be called after Firebase is initialized
       * @returns {function} Unsubscribe function
       */
      initializeAuth: () => {
        try {
          console.log('🔄 Initializing auth state listener...');
          
          const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
            console.log('🔄 Auth state changed:', firebaseUser ? 'User signed in' : 'User signed out');
            
            if (firebaseUser) {
              try {
                // Get user profile from database
                const profile = await authService.getUserProfile(firebaseUser.uid);
                
                set({
                  user: authService.formatUserData(firebaseUser),
                  profile,
                  isAuthenticated: true,
                  isLoading: false,
                });
                
                console.log('✅ User profile loaded successfully');
              } catch (error) {
                console.error('⚠️ Failed to load user profile:', error);
                set({
                  user: authService.formatUserData(firebaseUser),
                  profile: null,
                  isAuthenticated: true,
                  isLoading: false,
                });
              }
            } else {
              set({
                user: null,
                profile: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          });
          
          console.log('✅ Auth state listener initialized successfully');
          return unsubscribe;
          
        } catch (error) {
          console.error('❌ Failed to initialize auth listener:', error.message);
          
          // Set default unauthenticated state if Firebase isn't ready
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: `Auth initialization failed: ${error.message}`,
          });
          
          // Return a no-op unsubscribe function
          return () => {
            console.log('No-op auth unsubscribe called');
          };
        }
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
export const useAuthProfile = () => useAuthStore((state) => state.profile);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useUserPreferences = () => useAuthStore((state) => state.preferences);
export const usePhoneVerification = () => useAuthStore((state) => state.phoneVerification); 
