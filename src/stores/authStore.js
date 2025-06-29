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

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authService } from "../services/firebase/authService";
import { realtimeService } from "../services/firebase/realtimeService";

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
        theme: "cyber",
        gamingPlatform: null,
        notifications: true,
        privacy: "friends",
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
          console.log("🔐 Starting email sign in...");
          const result = await authService.signInWithEmail(email, password);
          const { user, profile, needsOnboarding } = result;

          // Log the sign-in result for debugging
          console.log("🔐 Sign in result:", {
            hasUser: !!user,
            hasProfile: !!profile,
            needsOnboarding: needsOnboarding,
            profileComplete: profile?.onboardingComplete,
            userId: user?.uid,
          });

          set({
            user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Enhanced logging for navigation debugging
          if (needsOnboarding) {
            console.log("📝 User needs onboarding - AppNavigator should stay in auth flow");
            console.log("📍 Expected route: GamingInterests or other onboarding step");
          } else {
            console.log("✅ User fully authenticated - AppNavigator should switch to main app");
            console.log("📍 Expected route: MainApp (TabNavigator)");
          }
          
          // Force a small delay to ensure state propagation
          setTimeout(() => {
            console.log("🔄 Auth state should now be propagated to AppNavigator");
          }, 100);
        } catch (error) {
          console.error("❌ Sign in failed:", error.message);
          set({
            isLoading: false,
            error: error.message,
          });
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
      signUpWithEmail: async (
        email,
        password,
        displayName,
        additionalData = {},
      ) => {
        set({ isLoading: true, error: null });

        try {
          console.log("📝 Starting email sign up...");
          const { user, profile } = await authService.signUpWithEmail(
            email,
            password,
            displayName,
            additionalData,
          );

          console.log("📝 Sign up result:", {
            hasUser: !!user,
            hasProfile: !!profile,
            profileComplete: profile?.onboardingComplete,
            userId: user?.uid,
          });

          set({
            user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          console.log("📝 New user signed up - AppNavigator should route to onboarding");
          console.log("📍 Expected route: GamingInterests (onboarding step)");
          
          // Force a small delay to ensure state propagation
          setTimeout(() => {
            console.log("🔄 Auth state should now be propagated to AppNavigator");
          }, 100);
        } catch (error) {
          console.error("❌ Sign up failed:", error.message);
          set({
            isLoading: false,
            error: error.message,
          });
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
          const { confirmation, verificationId } =
            await authService.signInWithPhoneNumber(phoneNumber);

          set({
            phoneVerification: {
              confirmation,
              verificationId,
              phoneNumber,
            },
            isLoading: false,
            error: null,
          });


          return verificationId;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error("Phone sign in failed:", error.message);
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
          throw new Error("No phone verification in progress");
        }

        set({ isLoading: true, error: null });

        try {
          const result = await authService.verifyPhoneNumber(
            phoneVerification.verificationId,
            code,
            additionalData,
          );
          const { user, profile, isNewUser, needsOnboarding } = result;

          // Log the verification result for debugging
          console.log("📱 Phone verification result:", {
            hasUser: !!user,
            hasProfile: !!profile,
            isNewUser,
            needsOnboarding,
            profileComplete: profile?.onboardingComplete,
          });

          set({
            user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            phoneVerification: null,
          });

          // If user needs onboarding, log it for the navigation system
          if (needsOnboarding) {
            console.log("📝 Phone user needs onboarding - will be redirected to auth flow");
          } else {
            console.log("✅ Phone user fully authenticated - proceeding to main app");
          }

          return { isNewUser, needsOnboarding };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error("❌ Phone verification failed:", error.message);
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
          // Clean up real-time services first to prevent permission errors

          await realtimeService.cleanup();

          // Sign out from Firebase Auth
          await authService.signOut();

          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            phoneVerification: null,
          });


        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error("❌ Sign out failed:", error.message);
          throw error;
        }
      },

      /**
       * Update user profile with optimistic updates to prevent restarts
       * @param {Object} updates - Profile updates
       * @returns {Promise<void>}
       */
      updateProfile: async (updates) => {
        const { user, profile } = get();

        if (!user) {
          throw new Error("No authenticated user");
        }



        // Store original profile for rollback
        const originalProfile = profile;

        set({ isLoading: true, error: null });

        try {
          // Create clean update data to avoid persistence issues
          const cleanUpdates = {
            displayName: updates.displayName?.trim(),
            username: updates.username?.trim(),
            bio: updates.bio?.trim(),
            gamingInterests: updates.gamingInterests,
            onboardingComplete: updates.onboardingComplete,
            profileCompletedAt: updates.profileCompletedAt,
          };

          // Remove undefined values
          Object.keys(cleanUpdates).forEach((key) => {
            if (cleanUpdates[key] === undefined) {
              delete cleanUpdates[key];
            }
          });

          // Update profile locally first (optimistic update)
          const optimisticProfile = {
            ...profile,
            ...cleanUpdates,
            lastActive: new Date().toISOString(), // Use string to avoid Date serialization issues
          };

          set({
            profile: optimisticProfile,
            isLoading: false,
            error: null,
          });



          // Update server in background
          authService
            .updateUserProfile(user.uid, cleanUpdates)
            .then((serverProfile) => {
              // Update with server response only if it differs significantly
              if (serverProfile && serverProfile.uid) {
                set({ profile: serverProfile });
              }
            })
            .catch((error) => {

              // Revert to original profile on server error
              set({
                profile: originalProfile,
                error: `Failed to save changes: ${error.message}`,
              });
            });
        } catch (error) {


          // Restore original state
          set({
            profile: originalProfile,
            isLoading: false,
            error: error.message,
          });

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
          console.error("Username check failed:", error.message);
          return false;
        }
      },

      /**
       * Update user avatar
       * @param {Object} avatarData - Avatar data with URLs and paths
       * @returns {Promise<void>}
       */
      updateAvatar: async (avatarData) => {
        const { user, profile } = get();

        if (!user) {
          throw new Error("No authenticated user");
        }

        set({ isLoading: true, error: null });

        try {
          const updatedProfile = await authService.updateAvatar(user.uid, avatarData);

          set({
            profile: updatedProfile,
            isLoading: false,
            error: null,
          });

          console.log("✅ Avatar updated successfully");
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error("❌ Avatar update failed:", error.message);
          throw error;
        }
      },

      /**
       * Remove user avatar
       * @returns {Promise<void>}
       */
      removeAvatar: async () => {
        const { user } = get();

        if (!user) {
          throw new Error("No authenticated user");
        }

        set({ isLoading: true, error: null });

        try {
          const updatedProfile = await authService.removeAvatar(user.uid);

          set({
            profile: updatedProfile,
            isLoading: false,
            error: null,
          });

          console.log("✅ Avatar removed successfully");
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error("❌ Avatar removal failed:", error.message);
          throw error;
        }
      },

      /**
       * Update profile banner
       * @param {Object} bannerData - Banner data with URLs and paths
       * @returns {Promise<void>}
       */
      updateProfileBanner: async (bannerData) => {
        const { user } = get();

        if (!user) {
          throw new Error("No authenticated user");
        }

        set({ isLoading: true, error: null });

        try {
          const updatedProfile = await authService.updateProfileBanner(user.uid, bannerData);

          set({
            profile: updatedProfile,
            isLoading: false,
            error: null,
          });

          console.log("✅ Profile banner updated successfully");
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error("❌ Profile banner update failed:", error.message);
          throw error;
        }
      },

      /**
       * Update status message
       * @param {Object} statusData - Status message data
       * @returns {Promise<void>}
       */
      updateStatusMessage: async (statusData) => {
        const { user } = get();

        if (!user) {
          throw new Error("No authenticated user");
        }

        set({ isLoading: true, error: null });

        try {
          const updatedProfile = await authService.updateStatusMessage(user.uid, statusData);

          set({
            profile: updatedProfile,
            isLoading: false,
            error: null,
          });

          console.log("✅ Status message updated successfully");
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error("❌ Status message update failed:", error.message);
          throw error;
        }
      },

      /**
       * Update achievement showcase
       * @param {Array} achievements - Array of achievements to showcase
       * @returns {Promise<void>}
       */
      updateAchievementShowcase: async (achievements) => {
        const { user } = get();

        if (!user) {
          throw new Error("No authenticated user");
        }

        set({ isLoading: true, error: null });

        try {
          const updatedProfile = await authService.updateAchievementShowcase(user.uid, achievements);

          set({
            profile: updatedProfile,
            isLoading: false,
            error: null,
          });

          console.log("✅ Achievement showcase updated successfully");
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error("❌ Achievement showcase update failed:", error.message);
          throw error;
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
          throw new Error("No authenticated user");
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


        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          console.error("Username reservation failed:", error.message);
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


          const unsubscribe = authService.onAuthStateChanged(
            async (firebaseUser) => {


              if (firebaseUser) {
                try {
                  // Get user profile from database
                  const profile = await authService.getUserProfile(
                    firebaseUser.uid,
                  );

                  set({
                    user: authService.formatUserData(firebaseUser),
                    profile,
                    isAuthenticated: true,
                    isLoading: false,
                  });


                } catch (error) {
                  console.error("⚠️ Failed to load user profile:", error);
                  set({
                    user: authService.formatUserData(firebaseUser),
                    profile: null,
                    isAuthenticated: true,
                    isLoading: false,
                  });
                }
              } else {
                // User signed out - clean up real-time services

                try {
                  await realtimeService.cleanup();

                } catch (error) {

                }

                set({
                  user: null,
                  profile: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
              }
            },
          );


          return unsubscribe;
        } catch (error) {
          console.error(
            "❌ Failed to initialize auth listener:",
            error.message,
          );

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

          };
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        // Only persist user preferences, not auth state
      }),
      // Add error handling for persistence operations
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("⚠️ Failed to rehydrate auth store:", error);
        }
      },
    },
  ),
);

/**
 * Selector hooks for specific auth state
 */
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthProfile = () => useAuthStore((state) => state.profile);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useUserPreferences = () =>
  useAuthStore((state) => state.preferences);
export const usePhoneVerification = () =>
  useAuthStore((state) => state.phoneVerification);
