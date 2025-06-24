/**
 * @file authService.js
 * @description Firebase authentication service for SnapConnect Phase 2.
 * Handles phone and email authentication, user profiles, and verification using Firebase v9+ Web SDK.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - firebase/auth: Firebase Authentication Web SDK
 * - firebase/database: Realtime Database Web SDK
 * 
 * @usage
 * import { authService } from '@/services/firebase/authService';
 * 
 * @ai_context
 * Integrates with AI services for user behavior analytics and gaming preference detection.
 */

import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import {
  get,
  ref,
  serverTimestamp,
  set,
  update
} from 'firebase/database';
import { auth, database } from '../../config/firebase';

/**
 * Authentication service class for Firebase integration
 */
class AuthService {
  constructor() {
    this.recaptchaVerifier = null;
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Promise<Object>} User credentials and profile
   */
  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from database
      const profile = await this.getUserProfile(user.uid);
      
      return {
        user: this.formatUserData(user),
        profile
      };
    } catch (error) {
      console.error('Email sign in failed:', error);
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update Firebase Auth profile
      await updateProfile(user, { displayName });
      
      // Create user profile in database
      const profile = await this.createUserProfile(user.uid, {
        email,
        displayName,
        authMethod: 'email',
        ...additionalData
      });
      
      return {
        user: this.formatUserData(user),
        profile
      };
    } catch (error) {
      console.error('Email sign up failed:', error);
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
      console.log('Phone authentication simulated for:', phoneNumber);
      
      // Return a mock confirmation object
      const mockVerificationId = `mock_${Date.now()}`;
      
      return {
        confirmation: {
          verificationId: mockVerificationId,
          confirm: async (code) => {
            // Mock verification - in production, this would verify the actual SMS code
            if (code === '123456') {
              // Create a mock user for demo purposes
              const mockUser = {
                uid: `phone_user_${Date.now()}`,
                phoneNumber: phoneNumber,
                providerData: [{ providerId: 'phone' }]
              };
              
              return {
                user: mockUser,
                additionalUserInfo: { isNewUser: true }
              };
            } else {
              throw new Error('Invalid verification code');
            }
          }
        },
        verificationId: mockVerificationId
      };
    } catch (error) {
      console.error('Phone sign in failed:', error);
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
      if (code === '123456') {
        const isNewUser = true;
        
        // Create mock user data
        const mockUser = {
          uid: `phone_user_${Date.now()}`,
          phoneNumber: '+1234567890', // Mock phone number
          displayName: additionalData.displayName || null,
          photoURL: null,
          emailVerified: false,
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
          }
        };
        
        let profile;
        if (isNewUser) {
          // Create new user profile
          profile = await this.createUserProfile(mockUser.uid, {
            phoneNumber: mockUser.phoneNumber,
            authMethod: 'phone',
            ...additionalData
          });
        } else {
          // Get existing user profile
          profile = await this.getUserProfile(mockUser.uid);
        }
        
        return {
          user: this.formatUserData(mockUser),
          profile,
          isNewUser
        };
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      console.error('Phone verification failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
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
      const profile = {
        uid,
        username: profileData.username || null,
        displayName: profileData.displayName || null,
        email: profileData.email || null,
        phoneNumber: profileData.phoneNumber || null,
        profilePhoto: profileData.profilePhoto || null,
        authMethod: profileData.authMethod,
        gamingPlatform: profileData.gamingPlatform || null,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        status: 'active',
        preferences: {
          theme: 'cyber',
          notifications: true,
          privacy: 'friends'
        }
      };
      
      const userRef = ref(database, `users/${uid}`);
      await set(userRef, profile);
      
      return profile;
    } catch (error) {
      console.error('Create user profile failed:', error);
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
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);
      return snapshot.val();
    } catch (error) {
      console.error('Get user profile failed:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} uid - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  async updateUserProfile(uid, updates) {
    try {
      const updateData = {
        ...updates,
        lastActive: serverTimestamp()
      };
      
      const userRef = ref(database, `users/${uid}`);
      await update(userRef, updateData);
      
      return await this.getUserProfile(uid);
    } catch (error) {
      console.error('Update user profile failed:', error);
      throw error;
    }
  }

  /**
   * Check if username is available
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} True if available
   */
  async isUsernameAvailable(username) {
    try {
      const usernameRef = ref(database, `usernames/${username.toLowerCase()}`);
      const snapshot = await get(usernameRef);
      
      return !snapshot.exists();
    } catch (error) {
      console.error('Username check failed:', error);
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
      const usernameRef = ref(database, `usernames/${username.toLowerCase()}`);
      await set(usernameRef, uid);
      
      const userRef = ref(database, `users/${uid}`);
      await update(userRef, { username });
    } catch (error) {
      console.error('Username reservation failed:', error);
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
      lastSignInTime: firebaseUser.metadata?.lastSignInTime
    };
  }

  /**
   * Handle authentication errors with user-friendly messages
   * @param {Error} error - Firebase auth error
   * @returns {Error} User-friendly error
   */
  handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account already exists with this email address.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/invalid-phone-number': 'Please enter a valid phone number.',
      'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
      'auth/code-expired': 'Verification code has expired. Please request a new one.',
    };

    const message = errorMessages[error.code] || error.message || 'An unexpected error occurred.';
    
    return new Error(message);
  }

  /**
   * Set up authentication state listener
   * @param {Function} callback - Callback function for auth state changes
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }
}

export const authService = new AuthService();
export default authService; 
