/**
 * @file activityTrackingService.ts
 * @description Activity tracking service for real-time user behavior monitoring.
 * Tracks user actions and updates profile stats for accurate achievement calculation.
 *
 * @author SnapConnect Team
 * @created 2024-01-24
 *
 * @dependencies
 * - @/config/firebase: Firebase configuration
 *
 * @usage
 * import { activityTrackingService } from '@/services/activity/activityTrackingService';
 *
 * @ai_context
 * AI-powered activity pattern recognition and smart achievement suggestions.
 */

import { firebase, getFirebaseDB } from '../../config/firebase';

/**
 * Activity types for tracking user behavior
 */
export type ActivityType = 
  | 'camera_capture'      // Taking photos/videos
  | 'story_create'        // Creating stories
  | 'message_send'        // Sending messages
  | 'friend_add'          // Adding friends
  | 'app_open'           // Opening the app
  | 'gaming_session'      // Gaming activity
  | 'achievement_unlock'  // Unlocking achievements
  | 'status_update'       // Updating status message
  | 'midnight_activity';  // Activity after midnight

/**
 * Activity data structure
 */
export interface ActivityData {
  type: ActivityType;
  userId: string;
  timestamp: number;
  metadata?: {
    mediaType?: 'photo' | 'video';
    result?: 'victory' | 'defeat';
    gameContext?: string;
    achievementId?: string;
    sessionDuration?: number;
    [key: string]: any;
  };
}

/**
 * User stats structure for database storage
 */
export interface UserStats {
  victories: number;
  highlights: number;
  friends: number;
  achievements: number;
  snapsSent: number;
  storiesCreated: number;
  messagesExchanged: number;
  sessionsCompleted: number;
  streakDays: number;
  lastActiveDate: string;
  midnightActivities: number;
  totalAppOpenings: number;
  gamingSessions: number;
  consecutiveDays: number;
  longestStreak: number;
  statusUpdates: number;
}

/**
 * Activity tracking service class
 */
class ActivityTrackingService {
  private db: any;
  private pendingActivities: ActivityData[] = [];

  constructor() {
    this.db = getFirebaseDB();
  }

  /**
   * Track a user activity and update stats
   * @param {ActivityData} activity - Activity to track
   */
  async trackActivity(activity: ActivityData): Promise<void> {
    try {
      await this.updateUserStats(activity.userId, [activity]);
    } catch (error) {
      console.error('❌ Activity tracking failed:', error);
      // Don't throw - activity tracking should be non-blocking
    }
  }

  /**
   * Update user statistics based on activities
   * @param {string} userId - User ID
   * @param {ActivityData[]} activities - Array of user activities
   */
  private async updateUserStats(userId: string, activities: ActivityData[]): Promise<void> {
    try {
      const userRef = this.db.collection('users').doc(userId);
      
      await this.db.runTransaction(async (transaction: any) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          console.warn(`⚠️ User ${userId} not found, skipping stats update`);
          return;
        }

        const userData = userDoc.data();
        const currentStats: UserStats = userData.stats || this.getDefaultStats();
        const updatedStats = this.calculateStatsUpdate(currentStats, activities);

        transaction.update(userRef, {
          stats: updatedStats,
          lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        });
      });

    } catch (error) {
      console.error(`❌ Stats update failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate updated stats based on activities
   * @param {UserStats} currentStats - Current user stats
   * @param {ActivityData[]} activities - New activities
   * @returns {UserStats} Updated stats
   */
  private calculateStatsUpdate(currentStats: UserStats, activities: ActivityData[]): UserStats {
    const newStats = { ...currentStats };
    const today = new Date().toISOString().split('T')[0];

    activities.forEach(activity => {
      switch (activity.type) {
        case 'camera_capture':
          newStats.snapsSent += 1;
          if (activity.metadata?.mediaType === 'video') {
            newStats.highlights += 1;
          }
          break;

        case 'story_create':
          newStats.storiesCreated += 1;
          break;

        case 'message_send':
          newStats.messagesExchanged += 1;
          break;

        case 'friend_add':
          newStats.friends += 1;
          break;

        case 'gaming_session':
          newStats.gamingSessions += 1;
          if (activity.metadata?.result === 'victory') {
            newStats.victories += 1;
          }
          break;

        case 'app_open':
          newStats.totalAppOpenings += 1;
          // Update streak tracking
          if (newStats.lastActiveDate !== today) {
            if (this.isConsecutiveDay(newStats.lastActiveDate, today)) {
              newStats.consecutiveDays += 1;
              newStats.streakDays = newStats.consecutiveDays;
              newStats.longestStreak = Math.max(newStats.longestStreak, newStats.consecutiveDays);
            } else {
              newStats.consecutiveDays = 1;
              newStats.streakDays = 1;
            }
            newStats.lastActiveDate = today;
          }
          break;

        case 'midnight_activity':
          newStats.midnightActivities += 1;
          break;

        case 'status_update':
          newStats.statusUpdates += 1;
          break;

        case 'achievement_unlock':
          newStats.achievements += 1;
          break;
      }
    });

    return newStats;
  }

  /**
   * Check if dates are consecutive days
   */
  private isConsecutiveDay(lastDate: string, currentDate: string): boolean {
    if (!lastDate) return false;
    
    const last = new Date(lastDate);
    const current = new Date(currentDate);
    const diffTime = current.getTime() - last.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 1;
  }

  /**
   * Get default user stats
   */
  private getDefaultStats(): UserStats {
    return {
      victories: 0,
      highlights: 0,
      friends: 0,
      achievements: 0,
      snapsSent: 0,
      storiesCreated: 0,
      messagesExchanged: 0,
      sessionsCompleted: 0,
      streakDays: 0,
      lastActiveDate: '',
      midnightActivities: 0,
      totalAppOpenings: 0,
      gamingSessions: 0,
      consecutiveDays: 0,
      longestStreak: 0,
      statusUpdates: 0,
    };
  }

  /**
   * Get user statistics from database
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const userRef = this.db.collection('users').doc(userId);
      const snapshot = await userRef.get();
      
      if (!snapshot.exists) {
        return this.getDefaultStats();
      }
      
      const userData = snapshot.data();
      return userData.stats || this.getDefaultStats();
    } catch (error) {
      console.error('❌ Failed to get user stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Convenience methods for common activities
   */

  async trackCameraCapture(userId: string, mediaType: 'photo' | 'video'): Promise<void> {
    await this.trackActivity({
      type: 'camera_capture',
      userId,
      timestamp: Date.now(),
      metadata: { mediaType }
    });
  }

  async trackStoryCreation(userId: string): Promise<void> {
    await this.trackActivity({
      type: 'story_create',
      userId,
      timestamp: Date.now()
    });
  }

  async trackGamingSession(userId: string, result: 'victory' | 'defeat', gameContext?: string): Promise<void> {
    await this.trackActivity({
      type: 'gaming_session',
      userId,
      timestamp: Date.now(),
      metadata: { result, gameContext }
    });
  }

  async trackFriendAdd(userId: string): Promise<void> {
    await this.trackActivity({
      type: 'friend_add',
      userId,
      timestamp: Date.now()
    });
  }

  async trackAppOpen(userId: string): Promise<void> {
    await this.trackActivity({
      type: 'app_open',
      userId,
      timestamp: Date.now()
    });
  }

  async trackMidnightActivity(userId: string): Promise<void> {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) { // Consider midnight to 6 AM as "midnight activity"
      await this.trackActivity({
        type: 'midnight_activity',
        userId,
        timestamp: Date.now()
      });
    }
  }

  async trackAchievementUnlock(userId: string, achievementId: string): Promise<void> {
    await this.trackActivity({
      type: 'achievement_unlock',
      userId,
      timestamp: Date.now(),
      metadata: { achievementId }
    });
  }
}

// Export singleton instance
export const activityTrackingService = new ActivityTrackingService(); 
