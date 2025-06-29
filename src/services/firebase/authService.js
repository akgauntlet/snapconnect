/**
 * @file authService.js
 * @description Firebase authentication service for SnapConnect Phase 2.
 * Handles phone and email authentication, user profiles, and verification using Firebase compat SDK.
 *
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-24
 *
 * @dependencies
 * - firebase/compat: Firebase Authentication Compat SDK
 *
 * @usage
 * import { authService } from '@/services/firebase/authService';
 *
 * @ai_context
 * Integrates with AI services for user behavior analytics and gaming preference detection.
 */

/**
 * Authentication service class for Firebase integration
 *
 * NOTE: This class is designed to be completely safe during module import.
 * No Firebase services are accessed until methods are actually called.
 */
class AuthService {
  constructor() {
    this.recaptchaVerifier = null;
    // Do NOT access Firebase services here - only when methods are called
  }

  /**
   * Get Firebase Auth instance (lazy-loaded)
   * @returns {object} Firebase Auth instance
   */
  getAuth() {
    // Dynamic import to avoid circular dependencies and early Firebase access
    const { getFirebaseAuth } = require("../../config/firebase");
    return getFirebaseAuth();
  }

  /**
   * Get Firestore instance (lazy-loaded)
   * @returns {object} Firestore instance
   */
  getDB() {
    // Dynamic import to avoid circular dependencies and early Firebase access
    const { getFirebaseDB } = require("../../config/firebase");
    return getFirebaseDB();
  }

  /**
   * Verify storage availability before authentication operations
   * @returns {Promise<boolean>} True if storage is working
   */
  async verifyStorage() {
    try {
      const { verifyAsyncStorage } = require("../../config/firebase");
      return await verifyAsyncStorage();
    } catch (error) {
      console.warn("⚠️ Storage verification failed:", error);
      return false;
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Promise<Object>} User credentials and profile
   */
  async signInWithEmail(email, password) {
    try {
      const auth = this.getAuth();

      const userCredential = await auth.signInWithEmailAndPassword(
        email,
        password,
      );
      const user = userCredential.user;

      console.log("✅ Email sign in successful for user:", user.uid);

      // Get user profile from database
      const profile = await this.getUserProfile(user.uid);

      // Check if profile exists and is valid
      if (!profile) {
        console.warn("⚠️ User signed in but profile is missing - needs onboarding");
        return {
          user: this.formatUserData(user),
          profile: null,
          needsOnboarding: true,
        };
      }

      // Check if profile is incomplete
      if (!profile.onboardingComplete) {
        console.warn("⚠️ User signed in but onboarding is incomplete");
        return {
          user: this.formatUserData(user),
          profile,
          needsOnboarding: true,
        };
      }

      console.log("✅ User sign in complete with valid profile");
      return {
        user: this.formatUserData(user),
        profile,
        needsOnboarding: false,
      };
    } catch (error) {
      console.error("❌ Email sign in failed:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign up with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @param {string} displayName - User display name
   * @param {Object} additionalData - Additional profile data
   * @returns {Promise<Object>} User credentials and profile
   */
  async signUpWithEmail(email, password, displayName, additionalData = {}) {
    try {
      

      // Verify storage is working before proceeding
      const storageWorking = await this.verifyStorage();
      if (!storageWorking) {
        console.warn(
          "⚠️ AsyncStorage verification failed, but continuing with auth...",
        );
      }

      const auth = this.getAuth();


      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password,
      );
      const user = userCredential.user;

      

      // Update Firebase Auth profile
      await user.updateProfile({ displayName });
      

      // Create user profile in database (includes username reservation)
      const profile = await this.createUserProfile(user.uid, {
        email,
        displayName,
        authMethod: "email",
        ...additionalData,
      });

      

      return {
        user: this.formatUserData(user),
        profile,
      };
    } catch (error) {
      console.error("❌ Email sign up failed:", error);

      // Check if this might be a storage error
      if (error.message && error.message.includes("setItem")) {
        console.error("🚨 Storage/persistence error detected during signup");
        console.warn(
          "⚠️ This is likely a local storage issue, not an authentication failure",
        );
        console.warn(
          "⚠️ Firebase Auth operations may have succeeded despite this error",
        );
        console.error("Storage error details:", error.message);

        // Wrap storage errors with user-friendly message
        const wrappedError = new Error(
          "Authentication completed but local storage may not be working properly.",
        );
        console.error(
          "❌ Email sign up failed:",
          `[${wrappedError.constructor.name}: ${wrappedError.message}]`,
        );
        console.warn(
          "⚠️ This appears to be a storage/persistence error, not an authentication error",
        );
        console.warn(
          "⚠️ The user may have been created successfully despite this error",
        );

        throw wrappedError;
      }

      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with phone number (Web SDK version - requires reCAPTCHA)
   * Note: This is a simplified implementation. In production, you'd want proper reCAPTCHA setup.
   * @param {string} phoneNumber - User phone number in E.164 format
   * @returns {Promise<Object>} Confirmation object for verification
   */
  async signInWithPhoneNumber(phoneNumber) {
    try {
      // For now, we'll simulate phone auth since reCAPTCHA setup is complex in Expo
      // In production, you'd set up reCAPTCHA verification


      // Return a mock confirmation object
      const mockVerificationId = `mock_${Date.now()}`;

      return {
        confirmation: {
          verificationId: mockVerificationId,
          confirm: async (code) => {
            // Mock verification - in production, this would verify the actual SMS code
            if (code === "123456") {
              // Create a mock user for demo purposes
              const mockUser = {
                uid: `phone_user_${Date.now()}`,
                phoneNumber: phoneNumber,
                providerData: [{ providerId: "phone" }],
              };

              return {
                user: mockUser,
                additionalUserInfo: { isNewUser: true },
              };
            } else {
              throw new Error("Invalid verification code");
            }
          },
        },
        verificationId: mockVerificationId,
      };
    } catch (error) {
      console.error("Phone sign in failed:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Verify phone number with SMS code (mock implementation)
   * @param {string} verificationId - Verification ID from phone sign in
   * @param {string} code - SMS verification code
   * @param {Object} additionalData - Additional profile data for new users
   * @returns {Promise<Object>} User credentials and profile
   */
  async verifyPhoneNumber(verificationId, code, additionalData = {}) {
    try {
      // Mock verification for demo purposes
      if (code === "123456") {
        const isNewUser = true;

        // Create mock user data
        const mockUser = {
          uid: `phone_user_${Date.now()}`,
          phoneNumber: "+1234567890", // Mock phone number
          displayName: additionalData.displayName || null,
          photoURL: null,
          emailVerified: false,
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString(),
          },
        };

        let profile;
        if (isNewUser) {
          // Create new user profile (includes username reservation)
          profile = await this.createUserProfile(mockUser.uid, {
            phoneNumber: mockUser.phoneNumber,
            authMethod: "phone",
            ...additionalData,
          });
        } else {
          // Get existing user profile
          profile = await this.getUserProfile(mockUser.uid);
        }

        // Check if profile is complete for existing users
        const needsOnboarding = !profile || !profile.onboardingComplete;
        
        if (needsOnboarding) {
          console.warn("⚠️ Phone user needs onboarding");
        } else {
          console.log("✅ Phone user has complete profile");
        }

        return {
          user: this.formatUserData(mockUser),
          profile,
          isNewUser,
          needsOnboarding,
        };
      } else {
        throw new Error("Invalid verification code");
      }
    } catch (error) {
      console.error("Phone verification failed:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      const auth = this.getAuth();
      await auth.signOut();

    } catch (error) {
      console.error("Sign out failed:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Create user profile in database
   * @param {string} uid - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Created profile
   */
  async createUserProfile(uid, profileData) {
    try {
      const db = this.getDB();
      const { firebase } = require("../../config/firebase");



      const profile = {
        uid,
        username: profileData.username || null,
        displayName: profileData.displayName || null,
        email: profileData.email || null,
        phoneNumber: profileData.phoneNumber || null,
        profilePhoto: profileData.profilePhoto || null,
        authMethod: profileData.authMethod,
        gamingPlatform: profileData.gamingPlatform || null,
        gamingInterests: profileData.gamingInterests || [],
        onboardingComplete: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        status: "active",
        preferences: {
          theme: "cyber",
          notifications: true,
          privacy: "friends",
        },
      };

      // Create user document first
      const userRef = db.collection("users").doc(uid);
      await userRef.set(profile);

      // Reserve username if provided (now that user document exists)
      if (profileData.username) {
        await this.reserveUsernameOnly(uid, profileData.username);
        // Update the user document with the username after successful reservation
        await userRef.update({ username: profileData.username });
        // Update the returned profile to include the username
        profile.username = profileData.username;
      }

      return profile;
    } catch (error) {
      console.error("❌ Create user profile failed:", error);
      throw error;
    }
  }

  /**
   * Get user profile from database
   * @param {string} uid - User ID
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile(uid) {
    try {
      console.log("🔍 Fetching user profile for UID:", uid);
      const db = this.getDB();
      const userRef = db.collection("users").doc(uid);
      const snapshot = await userRef.get();

      if (!snapshot.exists) {
        console.warn("⚠️ User profile not found for UID:", uid);
        // Try to recover missing profile by checking for reserved username
        console.log("🔄 Attempting profile recovery...");
        const recoveredProfile = await this.recoverMissingProfile(uid);
        if (recoveredProfile) {
          console.log("✅ Profile recovered successfully");
          return recoveredProfile;
        }

        console.warn("❌ Could not recover profile - user needs to complete onboarding");
        return null;
      }

      const profile = snapshot.data();
      console.log("✅ User profile retrieved:", { 
        uid: profile.uid, 
        hasUsername: !!profile.username,
        onboardingComplete: profile.onboardingComplete,
        email: !!profile.email,
        phoneNumber: !!profile.phoneNumber 
      });
      
      return profile;
    } catch (error) {
      console.error("❌ Get user profile failed:", error);
      throw error;
    }
  }

  /**
   * Attempt to recover a missing user profile by checking for reserved username
   * @param {string} uid - User ID
   * @returns {Promise<Object|null>} Recovered profile or null
   */
  async recoverMissingProfile(uid) {
    try {
      const db = this.getDB();
      const { firebase } = require("../../config/firebase");

      // Search for username reserved by this user
      const usernamesQuery = db.collection("usernames").where("uid", "==", uid);
      const usernameSnapshot = await usernamesQuery.get();

      let username = null;
      if (!usernameSnapshot.empty) {
        username = usernameSnapshot.docs[0].id;
      }

      // Get current Firebase Auth user to recover basic info
      const auth = this.getAuth();
      const currentUser = auth.currentUser;

      if (currentUser && currentUser.uid === uid) {

        const recoveredProfile = {
          uid,
          username,
          displayName: currentUser.displayName || null,
          email: currentUser.email || null,
          phoneNumber: currentUser.phoneNumber || null,
          profilePhoto: currentUser.photoURL || null,
          authMethod: currentUser.email ? "email" : "phone",
          gamingPlatform: null,
          gamingInterests: [],
          onboardingComplete: false, // Always false for recovered profiles
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastActive: firebase.firestore.FieldValue.serverTimestamp(),
          status: "active",
          preferences: {
            theme: "cyber",
            notifications: true,
            privacy: "friends",
          },
        };

        // Create the missing profile document
        const userRef = db.collection("users").doc(uid);
        await userRef.set(recoveredProfile);

        return recoveredProfile;
      }

      return null;
    } catch (error) {
      console.error("❌ Profile recovery failed:", error);
      return null;
    }
  }

  /**
   * Update user profile with improved error handling
   * @param {string} uid - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  async updateUserProfile(uid, updates) {
    try {
      const db = this.getDB();
      const { firebase } = require("../../config/firebase");

      // Handle username changes with improved error handling
      if (updates.username) {

        try {
          const currentProfile = await this.getUserProfile(uid);
          const currentUsername = currentProfile?.username;

          // If username is changing, update username reservation
          if (currentUsername !== updates.username) {

            // Check if new username is available before making any changes
            const isUsernameAvailableForCurrentUser = await this.isUsernameAvailable(
              updates.username,
            );
            
            let isOwnedByCurrentUser = false;
            
            // If username is not available, check if it's owned by the current user
            if (!isUsernameAvailableForCurrentUser) {
              const db = this.getDB();
              const usernameRef = db
                .collection("usernames")
                .doc(updates.username.toLowerCase());
              const usernameSnapshot = await usernameRef.get();
              
              // If the username exists but isn't owned by current user, it's taken
              if (usernameSnapshot.exists && usernameSnapshot.data().uid !== uid) {
                throw new Error("Username is already taken");
              }
              // If it's owned by current user, we can proceed with the update
              isOwnedByCurrentUser = usernameSnapshot.exists && usernameSnapshot.data().uid === uid;
            }

            // Only handle username reservations if we need to change them
            if (!isOwnedByCurrentUser) {
              // Remove old username reservation if it exists
              if (currentUsername) {
                try {
                  const oldUsernameRef = db
                    .collection("usernames")
                    .doc(currentUsername.toLowerCase());
                  await oldUsernameRef.delete();

                } catch (error) {
                  console.warn(
                    "⚠️ AuthService: Failed to remove old username reservation (non-critical):",
                    error,
                  );
                  // Don't throw here - this is not critical to the update process
                }
              }

              // Reserve new username
              try {
                await this.reserveUsernameOnly(uid, updates.username);
              } catch (error) {
                console.error(
                  "❌ AuthService: Failed to reserve new username:",
                  error,
                );

                // If username reservation fails, try to restore old username if it existed
                if (currentUsername) {
                  try {
                    await this.reserveUsernameOnly(uid, currentUsername);
                  } catch (restoreError) {
                    console.error(
                      "❌ AuthService: Failed to restore old username:",
                      restoreError,
                    );
                  }
                }

                throw new Error(
                  "Username reservation failed. The username might already be taken.",
                );
              }
            }
          }
        } catch (error) {
          console.error("❌ AuthService: Username processing failed:", error);
          throw error; // Re-throw to stop the update process
        }
      }

      // Update the user document

      const updateData = {
        ...updates,
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
      };

      try {
        const userRef = db.collection("users").doc(uid);
        await userRef.update(updateData);
      } catch (error) {
        console.error("❌ AuthService: Failed to update user document:", error);
        throw new Error("Failed to update profile in database");
      }

      // Get the updated profile
      try {
        const updatedProfile = await this.getUserProfile(uid);

        return updatedProfile;
      } catch (error) {
        console.error(
          "❌ AuthService: Failed to fetch updated profile:",
          error,
        );
        // Even if we can't fetch the updated profile, the update succeeded
        // Return the original profile with our updates applied
        return {
          uid,
          ...updates,
          lastActive: new Date(),
        };
      }
    } catch (error) {
      console.error("❌ AuthService: Update user profile failed:", error);

      // Provide more specific error messages
      if (error.message === "Username is already taken") {
        throw new Error(
          "Username is already taken. Please choose a different username.",
        );
      } else if (error.message.includes("Username reservation failed")) {
        throw new Error("Unable to reserve username. Please try again.");
      } else if (
        error.message.includes("Failed to update profile in database")
      ) {
        throw new Error(
          "Failed to save profile changes. Please check your internet connection and try again.",
        );
      } else {
        throw new Error(`Profile update failed: ${error.message}`);
      }
    }
  }

  /**
   * Check if username is available
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} True if available
   */
  async isUsernameAvailable(username) {
    try {
      const db = this.getDB();
      const usernameRef = db
        .collection("usernames")
        .doc(username.toLowerCase());
      const snapshot = await usernameRef.get();

      // If username doesn't exist, it's available
      if (!snapshot.exists) {
        return true;
      }

      // Username exists, check if the associated user still exists
      const reservationData = snapshot.data();
      const uid = reservationData?.uid;

      if (!uid) {
        // Invalid reservation data, clean it up
        console.warn("⚠️ Found username reservation without UID, cleaning up:", username);
        await usernameRef.delete();
        return true;
      }

      // Check if the user still exists by looking up their profile
      try {
        // Check if user document exists in Firestore
        const userRef = db.collection("users").doc(uid);
        const userSnapshot = await userRef.get();
        
        if (userSnapshot.exists) {
          // User exists, username is taken
          return false;
        } else {
          // User document doesn't exist, likely orphaned
          throw new Error("User document not found");
        }
      } catch (userNotFoundError) {
        // User doesn't exist anymore, clean up the orphaned username reservation
        console.warn("⚠️ Found orphaned username reservation, cleaning up:", {
          username,
          orphanedUid: uid,
          error: userNotFoundError.message
        });
        
        try {
          await usernameRef.delete();
          console.log("✅ Successfully cleaned up orphaned username:", username);
          return true; // Username is now available
        } catch (cleanupError) {
          console.error("❌ Failed to clean up orphaned username:", username, cleanupError);
          // Return false to be safe - don't allow username if we can't clean up
          return false;
        }
      }
    } catch (error) {
      console.error("Username check failed:", error);
      return false;
    }
  }

  /**
   * Reserve username for user
   * @param {string} uid - User ID
   * @param {string} username - Username to reserve
   * @returns {Promise<void>}
   */
  async reserveUsername(uid, username) {
    try {
      const db = this.getDB();
      const usernameRef = db
        .collection("usernames")
        .doc(username.toLowerCase());
      await usernameRef.set({ uid });

      const userRef = db.collection("users").doc(uid);
      await userRef.update({ username });
    } catch (error) {
      console.error("Username reservation failed:", error);
      throw error;
    }
  }

  /**
   * Reserve username in usernames collection only (used during profile creation)
   * @param {string} uid - User ID
   * @param {string} username - Username to reserve
   * @returns {Promise<void>}
   */
  async reserveUsernameOnly(uid, username) {
    try {
      const db = this.getDB();
      const usernameRef = db
        .collection("usernames")
        .doc(username.toLowerCase());
      await usernameRef.set({ uid });
    } catch (error) {
      console.error("❌ Username reservation failed:", error);
      throw error;
    }
  }

  /**
   * Format user data for consistent structure
   * @param {Object} firebaseUser - Firebase user object
   * @returns {Object} Formatted user data
   */
  formatUserData(firebaseUser) {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      phoneNumber: firebaseUser.phoneNumber,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      createdAt: firebaseUser.metadata?.creationTime,
      lastSignInTime: firebaseUser.metadata?.lastSignInTime,
    };
  }

  /**
   * Handle authentication errors with user-friendly messages
   * @param {Error} error - Firebase auth error
   * @returns {Error} User-friendly error
   */
  handleAuthError(error) {
    const errorMessages = {
      // Sign in errors
      "auth/user-not-found":
        "No account found with this email address. Please check your email or create a new account.",
      "auth/wrong-password":
        "Incorrect password. Please try again or reset your password.",
      "auth/invalid-credential":
        "Incorrect email or password. Please check your login details and try again.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-disabled":
        "This account has been disabled. Please contact support for assistance.",
      "auth/too-many-requests":
        "Too many failed attempts. Please wait a few minutes before trying again.",

      // Sign up errors
      "auth/email-already-in-use":
        "An account with this email already exists. Try signing in instead.",
      "auth/weak-password":
        "Password is too weak. Please use at least 6 characters with a mix of letters and numbers.",
      "auth/operation-not-allowed":
        "Email registration is currently disabled. Please contact support.",

      // Phone authentication errors
      "auth/invalid-phone-number":
        "Please enter a valid phone number with country code (e.g. +1 555-123-4567).",
      "auth/invalid-verification-code":
        "The verification code is incorrect. Please check the code and try again.",
      "auth/code-expired":
        "The verification code has expired. Please request a new code.",
      "auth/session-expired": "Your session has expired. Please try again.",
      "auth/quota-exceeded": "SMS quota exceeded. Please try again later.",

      // Network and general errors
      "auth/network-request-failed":
        "Network error. Please check your internet connection and try again.",
      "auth/internal-error":
        "Something went wrong on our end. Please try again in a moment.",
      "auth/cancelled-popup-request":
        "Sign-in was cancelled. Please try again.",
      "auth/popup-blocked":
        "Pop-up was blocked by your browser. Please enable pop-ups and try again.",
      "auth/popup-closed-by-user": "Sign-in was cancelled. Please try again.",

      // Token and session errors
      "auth/id-token-expired":
        "Your session has expired. Please sign in again.",
      "auth/id-token-revoked":
        "Your session is no longer valid. Please sign in again.",
      "auth/invalid-api-key": "Configuration error. Please contact support.",
      "auth/app-deleted":
        "This app is no longer available. Please contact support.",

      // Account management errors
      "auth/requires-recent-login":
        "For security, please sign out and sign in again to complete this action.",
      "auth/credential-already-in-use":
        "This credential is already associated with another account.",
      "auth/account-exists-with-different-credential":
        "An account already exists with the same email but different sign-in method.",
    };

    // Get user-friendly message or fall back to a generic one
    let message = errorMessages[error.code];

    if (!message) {
      // For unknown errors, provide a helpful generic message
      if (error.message && error.message.includes("auth/")) {
        message =
          "Authentication failed. Please check your details and try again.";
      } else {
        message = error.message || "Something went wrong. Please try again.";
      }
    }

    // Log the original error for debugging while showing user-friendly message
    console.error("Original Firebase error:", error.code, error.message);

    return new Error(message);
  }

  /**
   * Update user avatar
   * @param {string} uid - User ID
   * @param {Object} avatarData - Avatar data with URLs and paths
   * @returns {Promise<Object>} Updated profile
   */
  async updateAvatar(uid, avatarData) {
    try {
      const db = this.getDB();
      const { firebase } = require("../../config/firebase");

      // Update user profile with avatar data
      const updateData = {
        profilePhoto: avatarData.mainUrl,
        avatar: {
          urls: avatarData.urls,
          paths: avatarData.paths,
          uploadedAt: avatarData.uploadedAt,
        },
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const userRef = db.collection("users").doc(uid);
      await userRef.update(updateData);

      // Get updated profile
      const updatedProfile = await this.getUserProfile(uid);
      return updatedProfile;
    } catch (error) {
      console.error("❌ Avatar update failed:", error);
      throw error;
    }
  }

  /**
   * Remove user avatar
   * @param {string} uid - User ID
   * @returns {Promise<Object>} Updated profile
   */
  async removeAvatar(uid) {
    try {
      const db = this.getDB();
      const { firebase } = require("../../config/firebase");

      // Update user profile to remove avatar
      const updateData = {
        profilePhoto: null,
        avatar: null,
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const userRef = db.collection("users").doc(uid);
      await userRef.update(updateData);

      // Get updated profile
      const updatedProfile = await this.getUserProfile(uid);
      return updatedProfile;
    } catch (error) {
      console.error("❌ Avatar removal failed:", error);
      throw error;
    }
  }

  /**
   * Update user profile banner
   * @param {string} uid - User ID
   * @param {Object} bannerData - Banner data with URLs and paths
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfileBanner(uid, bannerData) {
    try {
      const db = this.getDB();
      const { firebase } = require("../../config/firebase");

      // Update user profile with banner data
      const updateData = {
        profileBanner: {
          url: bannerData.mainUrl,
          urls: bannerData.urls,
          paths: bannerData.paths,
          position: bannerData.position || 'center',
          uploadedAt: bannerData.uploadedAt,
        },
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const userRef = db.collection("users").doc(uid);
      await userRef.update(updateData);

      // Get updated profile
      const updatedProfile = await this.getUserProfile(uid);
      return updatedProfile;
    } catch (error) {
      console.error("❌ Profile banner update failed:", error);
      throw error;
    }
  }

  /**
   * Update user status message
   * @param {string} uid - User ID
   * @param {Object} statusData - Status message data
   * @returns {Promise<Object>} Updated profile
   */
  async updateStatusMessage(uid, statusData) {
    try {
      const db = this.getDB();
      const { firebase } = require("../../config/firebase");

      // Prepare status message with expiration if provided
      const statusMessage = {
        text: statusData.text,
        emoji: statusData.emoji || null,
        gameContext: statusData.gameContext || null,
        availability: statusData.availability || 'available',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      // Add expiration if provided
      if (statusData.expiresAt) {
        statusMessage.expiresAt = statusData.expiresAt;
      }

      const updateData = {
        statusMessage,
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const userRef = db.collection("users").doc(uid);
      await userRef.update(updateData);

      // Get updated profile
      const updatedProfile = await this.getUserProfile(uid);
      return updatedProfile;
    } catch (error) {
      console.error("❌ Status message update failed:", error);
      throw error;
    }
  }

  /**
   * Update achievement showcase
   * @param {string} uid - User ID
   * @param {Array} achievements - Array of achievement IDs to showcase
   * @returns {Promise<Object>} Updated profile
   */
  async updateAchievementShowcase(uid, achievements) {
    try {
      const db = this.getDB();
      const { firebase } = require("../../config/firebase");

      // Limit to 5 achievements and validate structure
      const showcaseAchievements = achievements.slice(0, 5).map(achievement => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity,
        unlockedAt: achievement.unlockedAt,
      }));

      const updateData = {
        achievementShowcase: showcaseAchievements,
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const userRef = db.collection("users").doc(uid);
      await userRef.update(updateData);

      // Get updated profile
      const updatedProfile = await this.getUserProfile(uid);
      return updatedProfile;
    } catch (error) {
      console.error("❌ Achievement showcase update failed:", error);
      throw error;
    }
  }

  /**
   * Set up authentication state listener
   * @param {Function} callback - Callback function for auth state changes
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChanged(callback) {
    const auth = this.getAuth();
    return auth.onAuthStateChanged(callback);
  }
}

// Create a single instance that's safe to import
export const authService = new AuthService();
export default authService;
