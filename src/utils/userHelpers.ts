/**
 * @file userHelpers.ts
 * @description Utility functions for user data handling and fallbacks.
 * Provides consistent fallback values and data formatting across the app.
 *
 * @author SnapConnect Team
 * @created 2024-01-25
 *
 * @dependencies
 * - @/utils/constants: App constants
 *
 * @usage
 * import { getUserDisplayName, getUserStats } from '@/utils/userHelpers';
 *
 * @ai_context
 * Smart user data processing with AI-enhanced fallback generation.
 */

import { UX_CONFIG } from './constants';

/**
 * Get user display name with proper fallback hierarchy
 * @param {Object} user - User object from auth store
 * @param {Object} profile - User profile from database
 * @param {boolean} isLoading - Loading state
 * @returns {string} Display name with fallbacks
 */
export function getUserDisplayName(user: any, profile: any, isLoading: boolean = false): string {
  if (isLoading) return UX_CONFIG.LOADING_TEXT;
  
  return (
    profile?.displayName ||
    user?.displayName ||
    profile?.username ||
    user?.username ||
    UX_CONFIG.DEFAULT_DISPLAY_NAME
  );
}

/**
 * Get user username with proper fallback hierarchy
 * @param {Object} profile - User profile from database
 * @param {boolean} isLoading - Loading state
 * @returns {string} Username with @ prefix and fallbacks
 */
export function getUserUsername(profile: any, isLoading: boolean = false): string {
  if (isLoading) return UX_CONFIG.LOADING_USERNAME;
  
  const username = profile?.username;
  if (username) return `@${username}`;
  
  // Generate fallback username based on user ID or timestamp
  const fallbackId = profile?.uid?.slice(-8) || Date.now().toString().slice(-8);
  return `${UX_CONFIG.DEFAULT_USERNAME_PREFIX}${fallbackId}`;
}

/**
 * Get user bio with no fallback - returns empty string if not set
 * @param {Object} profile - User profile from database
 * @returns {string} User bio or empty string
 */
export function getUserBio(profile: any): string {
  return profile?.bio || '';
}

/**
 * Get user stats with fallbacks
 * Note: Friend count should be fetched separately using useFriendCount hook for real-time data
 * @param {Object} profile - User profile from database
 * @returns {Object} User stats with fallbacks (excluding dynamic friend count)
 */
export function getUserStats(profile: any): any {
  const stats = profile?.stats || {};
  
  return {
    victories: stats.victories || UX_CONFIG.DEFAULT_PROFILE_STATS.victories,
    highlights: stats.highlights || UX_CONFIG.DEFAULT_PROFILE_STATS.highlights,
    friends: stats.friends || UX_CONFIG.DEFAULT_PROFILE_STATS.friends, // Note: Use useFriendCount hook for real-time count
    achievements: stats.achievements || UX_CONFIG.DEFAULT_PROFILE_STATS.achievements,
  };
}

/**
 * Get user stats with actual achievement count calculated dynamically
 * @param {Object} profile - User profile from database
 * @returns {Object} User stats with real-time achievement count
 */
export function getUserStatsWithActualAchievements(profile: any): any {
  const baseStats = getUserStats(profile);
  
  // Import here to avoid circular dependency
  const { getActualAchievementCount } = require('./achievementHelpers');
  
  return {
    ...baseStats,
    achievements: getActualAchievementCount(profile),
  };
}

/**
 * Get unknown user label consistently
 * @returns {string} Unknown user label
 */
export function getUnknownUserLabel(): string {
  return UX_CONFIG.UNKNOWN_USER_LABEL;
}

/**
 * Format user data for conversation items
 * @param {Object} userProfile - User profile object
 * @returns {string} Formatted display name
 */
export function formatConversationUserName(userProfile: any): string {
  return (
    userProfile?.displayName ||
    userProfile?.username ||
    getUnknownUserLabel()
  );
}

/**
 * Get loading text consistently
 * @returns {string} Loading text
 */
export function getLoadingText(): string {
  return UX_CONFIG.LOADING_TEXT;
}

/**
 * Generate unique username suggestion
 * @param {string} baseUsername - Base username to build from
 * @param {Array} existingUsernames - Array of existing usernames to avoid
 * @returns {string} Unique username suggestion
 */
export function generateUniqueUsername(baseUsername: string, existingUsernames: string[] = []): string {
  let suggestion = baseUsername;
  let counter = 1;
  
  while (existingUsernames.includes(suggestion)) {
    suggestion = `${baseUsername}${counter}`;
    counter++;
  }
  
  return suggestion;
}

/**
 * Validate and format phone number
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as US number if 10 digits
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // Return as-is if already formatted or invalid
  return phoneNumber;
}

/**
 * Check if user data is complete
 * @param {Object} profile - User profile
 * @returns {boolean} True if profile is complete
 */
export function isUserProfileComplete(profile: any): boolean {
  return !!(
    profile?.displayName &&
    profile?.username &&
    profile?.bio
  );
}

/**
 * Get profile completion percentage
 * @param {Object} profile - User profile
 * @returns {number} Completion percentage (0-100)
 */
export function getProfileCompletionPercentage(profile: any): number {
  if (!profile) return 0;
  
  const fields = [
    profile?.displayName,
    profile?.username,
    profile?.bio,
    profile?.profilePhoto,
    profile?.gamingPlatform,
  ];
  
  const completedFields = fields.filter(field => field && field.trim()).length;
  return Math.round((completedFields / fields.length) * 100);
}

/**
 * Check if a user profile is complete and valid
 * @param {Object|null} profile - User profile object
 * @returns {boolean} True if profile is complete and valid
 */
export function isProfileComplete(profile: any): boolean {
  if (!profile) {
    return false;
  }

  // Check if onboarding is explicitly marked as complete
  if (!profile.onboardingComplete) {
    return false;
  }

  // Additional validation for critical profile fields
  const hasRequiredFields = profile.uid && (profile.email || profile.phoneNumber);
  if (!hasRequiredFields) {
    return false;
  }

  return true;
}

/**
 * Determine what onboarding step a user needs to complete
 * @param {Object|null} profile - User profile object
 * @returns {string} The onboarding step needed
 */
export function getOnboardingStep(profile: any): string {
  if (!profile) {
    return 'signup'; // User needs to create an account
  }

  // Check basic profile fields
  if (!profile.displayName || !profile.username) {
    return 'profile_setup'; // User needs to complete basic profile
  }

  // Check gaming interests
  if (!profile.gamingInterests || profile.gamingInterests.length === 0) {
    return 'gaming_interests'; // User needs to select gaming interests
  }

  // Check if onboarding is marked complete
  if (!profile.onboardingComplete) {
    return 'gaming_interests'; // Default to gaming interests if not complete
  }

  return 'complete'; // Profile is complete
}

/**
 * Check if a user needs onboarding based on their profile
 * @param {Object|null} profile - User profile object
 * @returns {boolean} True if user needs onboarding
 */
export function needsOnboarding(profile: any): boolean {
  return !isProfileComplete(profile);
}

/**
 * Validate user profile data for completeness
 * @param {Object} profile - User profile object
 * @returns {Object} Validation result with missing fields
 */
export function validateUserProfile(profile: any): { 
  isValid: boolean; 
  missingFields: string[]; 
  errors: string[] 
} {
  const missingFields: string[] = [];
  const errors: string[] = [];

  if (!profile) {
    return {
      isValid: false,
      missingFields: ['profile'],
      errors: ['User profile is missing completely']
    };
  }

  // Check required fields
  if (!profile.uid) missingFields.push('uid');
  if (!profile.displayName) missingFields.push('displayName');
  if (!profile.username) missingFields.push('username');
  if (!profile.email && !profile.phoneNumber) {
    missingFields.push('email or phoneNumber');
    errors.push('User must have either email or phone number');
  }

  // Check onboarding completion
  if (!profile.onboardingComplete) {
    missingFields.push('onboardingComplete');
    errors.push('User has not completed onboarding flow');
  }

  // Check if gaming interests are set (optional but recommended)
  if (!profile.gamingInterests || profile.gamingInterests.length === 0) {
    errors.push('User has not selected gaming interests (recommended)');
  }

  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    errors
  };
} 
