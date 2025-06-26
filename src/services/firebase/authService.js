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
    const { getFirebaseAuth } = require('../../config/firebase');
    return getFirebaseAuth();
  }

  /**
   * Get Firestore instance (lazy-loaded)
   * @returns {object} Firestore instance
   */
  getDB() {
    // Dynamic import to avoid circular dependencies and early Firebase access
    const { getFirebaseDB } = require('../../config/firebase');
    return getFirebaseDB();
  }

  /**
   * Verify storage availability before authentication operations
   * @returns {Promise<boolean>} True if storage is working
   */
  async verifyStorage() {
    try {
      const { verifyAsyncStorage } = require('../../config/firebase');
      return await verifyAsyncStorage();
    } catch (error) {
      console.warn('⚠️ Storage verification failed:', error);
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
      console.log('🔄 Starting email signin process for:', email);
      console.log('📞 Calling authService.signInWithEmail...');
      console.log('🔄 Getting Firebase Auth instance...');
      
      const auth = this.getAuth();
      console.log('🔄 Signing in with email and password...');
      
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log('✅ Firebase Auth signin successful');
      
      // Get user profile from database
      const profile = await this.getUserProfile(user.uid);
      
      console.log('✅ User profile loaded successfully');
      
      return {
        user: this.formatUserData(user),
        profile
      };
    } catch (error) {
      console.error('❌ Email sign in failed:', error);
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
      console.log('🔄 Starting email signup process for:', email);
      console.log('📞 Calling authService.signUpWithEmail...');
      console.log('🔄 Getting Firebase Auth instance...');
      
      // Verify storage is working before proceeding
      const storageWorking = await this.verifyStorage();
      if (!storageWorking) {
        console.warn('⚠️ AsyncStorage verification failed, but continuing with auth...');
      }
      
      const auth = this.getAuth();
      console.log('🔄 Creating user with email and password...');
      
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log('✅ Firebase Auth user created successfully');
      
      // Update Firebase Auth profile
      await user.updateProfile({ displayName });
      console.log('✅ Firebase Auth profile updated');
      
      // Create user profile in database (includes username reservation)
      const profile = await this.createUserProfile(user.uid, {
        email,
        displayName,
        authMethod: 'email',
        ...additionalData
      });
      
      console.log('✅ User profile created in database');
      
      return {
        user: this.formatUserData(user),
        profile
      };
    } catch (error) {
      console.error('❌ Email sign up failed:', error);
      
      // Check if this might be a storage error
      if (error.message && error.message.includes('setItem')) {
        console.error('🚨 Storage/persistence error detected during signup');
        console.warn('⚠️ This is likely a local storage issue, not an authentication failure');
        console.warn('⚠️ Firebase Auth operations may have succeeded despite this error');
        console.error('Storage error details:', error.message);
        
        // Wrap storage errors with user-friendly message
        const wrappedError = new Error('Authentication completed but local storage may not be working properly.');
        console.error('❌ Email sign up failed:', `[${wrappedError.constructor.name}: ${wrappedError.message}]`);
        console.warn('⚠️ This appears to be a storage/persistence error, not an authentication error');
        console.warn('⚠️ The user may have been created successfully despite this error');
        
        throw wrappedError;
      }
      
      throw this.handleAuthError(error);
    } finally {
      console.log('✅ Signup process completed (storage issues may exist but auth should work)');
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
          // Create new user profile (includes username reservation)
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
      const auth = this.getAuth();
      await auth.signOut();
      console.log('✅ User signed out successfully');
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
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      
      console.log('🔄 Creating user profile for:', uid, 'with data:', profileData);
      
      const profile = {
        uid,
        username: profileData.username || null,
        displayName: profileData.displayName || null,
        email: profileData.email || null,
        phoneNumber: profileData.phoneNumber || null,
        profilePhoto: profileData.profilePhoto || null,
        authMethod: profileData.authMethod,
        gamingPlatform: profileData.gamingPlatform || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        preferences: {
          theme: 'cyber',
          notifications: true,
          privacy: 'friends'
        }
      };
      
      // Create user document first
      const userRef = db.collection('users').doc(uid);
      await userRef.set(profile);
      console.log('✅ User document created successfully');
      
      // Reserve username if provided (now that user document exists)
      if (profileData.username) {
        await this.reserveUsernameOnly(uid, profileData.username);
        console.log('✅ Username reserved:', profileData.username);
      }
      
      return profile;
    } catch (error) {
      console.error('❌ Create user profile failed:', error);
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
      const db = this.getDB();
      const userRef = db.collection('users').doc(uid);
      const snapshot = await userRef.get();
      
      if (!snapshot.exists) {
        console.warn('⚠️ User profile not found for UID:', uid);
        console.log('🔄 Attempting to recover missing profile...');
        
        // Try to recover missing profile by checking for reserved username
        const recoveredProfile = await this.recoverMissingProfile(uid);
        if (recoveredProfile) {
          console.log('✅ Profile recovered successfully');
          return recoveredProfile;
        }
        
        console.warn('⚠️ Could not recover profile, returning null');
        return null;
      }
      
      return snapshot.data();
    } catch (error) {
      console.error('Get user profile failed:', error);
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
      const { firebase } = require('../../config/firebase');
      
      // Search for username reserved by this user
      const usernamesQuery = db.collection('usernames').where('uid', '==', uid);
      const usernameSnapshot = await usernamesQuery.get();
      
      let username = null;
      if (!usernameSnapshot.empty) {
        username = usernameSnapshot.docs[0].id;
        console.log('🔍 Found reserved username:', username);
      }
      
      // Get current Firebase Auth user to recover basic info
      const auth = this.getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.uid === uid) {
        console.log('🔄 Recovering profile from Firebase Auth user...');
        
        const recoveredProfile = {
          uid,
          username,
          displayName: currentUser.displayName || null,
          email: currentUser.email || null,
          phoneNumber: currentUser.phoneNumber || null,
          profilePhoto: currentUser.photoURL || null,
          authMethod: currentUser.email ? 'email' : 'phone',
          gamingPlatform: null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastActive: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'active',
          preferences: {
            theme: 'cyber',
            notifications: true,
            privacy: 'friends'
          }
        };
        
        // Create the missing profile document
        const userRef = db.collection('users').doc(uid);
        await userRef.set(recoveredProfile);
        console.log('✅ Missing profile document created');
        
        return recoveredProfile;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Profile recovery failed:', error);
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
      const { firebase } = require('../../config/firebase');
      
      console.log('🔄 AuthService: Updating user profile for:', uid, 'with updates:', updates);
      
      // Handle username changes with improved error handling
      if (updates.username) {
        console.log('🔄 AuthService: Processing username change...');
        
        try {
          const currentProfile = await this.getUserProfile(uid);
          const currentUsername = currentProfile?.username;
          
          // If username is changing, update username reservation
          if (currentUsername !== updates.username) {
            console.log('🔄 AuthService: Username changing from:', currentUsername, 'to:', updates.username);
            
            // Check if new username is available before making any changes
            const isAvailable = await this.isUsernameAvailable(updates.username);
            if (!isAvailable) {
              throw new Error('Username is already taken');
            }
            
            // Remove old username reservation if it exists
            if (currentUsername) {
              try {
                const oldUsernameRef = db.collection('usernames').doc(currentUsername.toLowerCase());
                await oldUsernameRef.delete();
                console.log('✅ AuthService: Old username reservation removed:', currentUsername);
              } catch (error) {
                console.warn('⚠️ AuthService: Failed to remove old username reservation (non-critical):', error);
                // Don't throw here - this is not critical to the update process
              }
            }
            
            // Reserve new username
            try {
              await this.reserveUsernameOnly(uid, updates.username);
              console.log('✅ AuthService: New username reserved:', updates.username);
            } catch (error) {
              console.error('❌ AuthService: Failed to reserve new username:', error);
              
              // If username reservation fails, try to restore old username if it existed
              if (currentUsername) {
                try {
                  await this.reserveUsernameOnly(uid, currentUsername);
                  console.log('🔄 AuthService: Restored old username reservation');
                } catch (restoreError) {
                  console.error('❌ AuthService: Failed to restore old username:', restoreError);
                }
              }
              
              throw new Error('Username reservation failed. The username might already be taken.');
            }
          } else {
            console.log('✅ AuthService: Username unchanged, skipping reservation');
          }
        } catch (error) {
          console.error('❌ AuthService: Username processing failed:', error);
          throw error; // Re-throw to stop the update process
        }
      }
      
      // Update the user document
      console.log('🔄 AuthService: Updating user document...');
      
      const updateData = {
        ...updates,
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      try {
        const userRef = db.collection('users').doc(uid);
        await userRef.update(updateData);
        console.log('✅ AuthService: User profile document updated');
      } catch (error) {
        console.error('❌ AuthService: Failed to update user document:', error);
        throw new Error('Failed to update profile in database');
      }
      
      // Get the updated profile
      console.log('🔄 AuthService: Fetching updated profile...');
      
      try {
        const updatedProfile = await this.getUserProfile(uid);
        console.log('✅ AuthService: Profile update completed successfully');
        
        return updatedProfile;
      } catch (error) {
        console.error('❌ AuthService: Failed to fetch updated profile:', error);
        // Even if we can't fetch the updated profile, the update succeeded
        // Return the original profile with our updates applied
        console.log('⚠️ AuthService: Returning constructed profile due to fetch error');
        return {
          uid,
          ...updates,
          lastActive: new Date()
        };
      }
      
    } catch (error) {
      console.error('❌ AuthService: Update user profile failed:', error);
      
      // Provide more specific error messages
      if (error.message === 'Username is already taken') {
        throw new Error('Username is already taken. Please choose a different username.');
      } else if (error.message.includes('Username reservation failed')) {
        throw new Error('Unable to reserve username. Please try again.');
      } else if (error.message.includes('Failed to update profile in database')) {
        throw new Error('Failed to save profile changes. Please check your internet connection and try again.');
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
      const usernameRef = db.collection('usernames').doc(username.toLowerCase());
      const snapshot = await usernameRef.get();
      
      return !snapshot.exists;
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
      const db = this.getDB();
      const usernameRef = db.collection('usernames').doc(username.toLowerCase());
      await usernameRef.set({ uid });
      
      const userRef = db.collection('users').doc(uid);
      await userRef.update({ username });
    } catch (error) {
      console.error('Username reservation failed:', error);
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
      const usernameRef = db.collection('usernames').doc(username.toLowerCase());
      await usernameRef.set({ uid });
      console.log('✅ Username reserved in usernames collection:', username);
    } catch (error) {
      console.error('❌ Username reservation failed:', error);
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
    const auth = this.getAuth();
    return auth.onAuthStateChanged(callback);
  }
}

// Create a single instance that's safe to import
export const authService = new AuthService();
export default authService; 
