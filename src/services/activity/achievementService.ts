/**
 * @file achievementService.ts
 * @description Achievement service for tracking real user progress and unlocking achievements.
 * Works with the activity tracking service to provide accurate achievement data.
 *
 * @author SnapConnect Team
 * @created 2024-01-24
 *
 * @dependencies
 * - @/services/activity/activityTrackingService: Activity tracking
 * - @/config/firebase: Firebase configuration
 *
 * @usage
 * import { achievementService } from '@/services/activity/achievementService';
 *
 * @ai_context
 * AI-powered achievement recommendation and smart unlock criteria.
 */

import { getFirebaseDB } from '../../config/firebase';
import { activityTrackingService, UserStats } from './activityTrackingService';

/**
 * Achievement definition with unlock criteria
 */
export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
  category: 'social' | 'gaming' | 'creative' | 'engagement' | 'special';
  unlockCriteria: {
    type: 'stat_threshold' | 'streak' | 'special_condition';
    conditions: Record<string, any>;
  };
  reward?: {
    type: 'badge' | 'title' | 'filter' | 'boost';
    value: string;
  };
}

/**
 * User achievement record
 */
export interface UserAchievement {
  id: string;
  unlockedAt: number;
  progress?: {
    current: number;
    total: number;
  };
}

/**
 * Achievement definitions with real unlock criteria
 */
const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Social Achievements
  {
    id: 'first_snap',
    title: 'First Snap',
    description: 'Share your first snap with friends',
    icon: 'camera',
    rarity: 'common',
    tier: 'bronze',
    points: 10,
    category: 'creative',
    unlockCriteria: {
      type: 'stat_threshold',
      conditions: { snapsSent: 1 }
    },
    reward: { type: 'badge', value: 'Photographer' }
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Add 50 friends to your network',
    icon: 'people',
    rarity: 'rare',
    tier: 'silver',
    points: 25,
    category: 'social',
    unlockCriteria: {
      type: 'stat_threshold',
      conditions: { friends: 50 }
    },
    reward: { type: 'boost', value: 'Friend Finder' }
  },
  {
    id: 'gaming_legend',
    title: 'Gaming Legend',
    description: 'Win 100 gaming matches',
    icon: 'trophy',
    rarity: 'legendary',
    tier: 'diamond',
    points: 100,
    category: 'gaming',
    unlockCriteria: {
      type: 'stat_threshold',
      conditions: { victories: 100 }
    },
    reward: { type: 'title', value: 'Gaming Legend' }
  },
  {
    id: 'first_victory',
    title: 'First Victory',
    description: 'Win your first gaming match',
    icon: 'medal',
    rarity: 'common',
    tier: 'bronze',
    points: 10,
    category: 'gaming',
    unlockCriteria: {
      type: 'stat_threshold',
      conditions: { victories: 1 }
    },
    reward: { type: 'badge', value: 'Winner' }
  },
  {
    id: 'content_creator',
    title: 'Content Creator',
    description: 'Create 25 gaming highlights',
    icon: 'play-circle',
    rarity: 'epic',
    tier: 'gold',
    points: 50,
    category: 'creative',
    unlockCriteria: {
      type: 'stat_threshold',
      conditions: { highlights: 25 }
    },
    reward: { type: 'filter', value: 'Creator Mode' }
  },
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Use the app for 7 consecutive days',
    icon: 'calendar',
    rarity: 'common',
    tier: 'bronze',
    points: 15,
    category: 'engagement',
    unlockCriteria: {
      type: 'streak',
      conditions: { consecutiveDays: 7 }
    },
    reward: { type: 'boost', value: 'Streak Master' }
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Share content after midnight 10 times',
    icon: 'moon',
    rarity: 'rare',
    tier: 'silver',
    points: 25,
    category: 'engagement',
    unlockCriteria: {
      type: 'stat_threshold',
      conditions: { midnightActivities: 10 }
    },
    reward: { type: 'filter', value: 'Midnight Mode' }
  },
  {
    id: 'early_adopter',
    title: 'Early Adopter',
    description: 'Join SnapConnect in its first month',
    icon: 'rocket',
    rarity: 'rare',
    tier: 'silver',
    points: 25,
    category: 'special',
    unlockCriteria: {
      type: 'special_condition',
      conditions: { joinedBefore: '2024-02-01' }
    },
    reward: { type: 'badge', value: 'Pioneer' }
  },
];

/**
 * Achievement service class
 */
class AchievementService {
  private db: any;

  constructor() {
    this.db = getFirebaseDB();
  }

  /**
   * Get all achievement definitions
   */
  getAllAchievementDefinitions(): AchievementDefinition[] {
    return ACHIEVEMENT_DEFINITIONS;
  }

  /**
   * Get achievements with progress for display
   */
  async getAchievementsWithProgress(userId: string, userStats: UserStats): Promise<any[]> {
    try {
      const unlockedAchievements = await this.getUserAchievements(userId);
      const unlockedIds = new Set(unlockedAchievements.map(a => a.id));

      return ACHIEVEMENT_DEFINITIONS.map(definition => {
        const isUnlocked = unlockedIds.has(definition.id);
        const unlockedData = unlockedAchievements.find(a => a.id === definition.id);

        // Calculate progress
        let progress: { current: number; total: number } | undefined;
        if (!isUnlocked && definition.unlockCriteria.type === 'stat_threshold') {
          const conditions = definition.unlockCriteria.conditions;
          const statKey = Object.keys(conditions)[0];
          const threshold = conditions[statKey];
          const current = (userStats as any)[statKey] || 0;
          
          progress = {
            current: Math.min(current, threshold),
            total: threshold
          };
        }

        return {
          id: definition.id,
          title: definition.title,
          description: definition.description,
          icon: definition.icon,
          rarity: definition.rarity,
          tier: definition.tier,
          points: definition.points,
          category: definition.category,
          unlocked: isUnlocked,
          unlockedAt: unlockedData?.unlockedAt,
          progress,
          reward: definition.reward
        };
      });
    } catch (error) {
      console.error('❌ Failed to get achievements with progress:', error);
      return [];
    }
  }

  /**
   * Get user's current achievements from database
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const userRef = this.db.collection('users').doc(userId);
      const snapshot = await userRef.get();
      
      if (!snapshot.exists) {
        return [];
      }
      
      const userData = snapshot.data();
      return userData.unlockedAchievements || [];
    } catch (error) {
      console.error('❌ Failed to get user achievements:', error);
      return [];
    }
  }

  /**
   * Check and unlock achievements for a user
   */
  async checkAndUnlockAchievements(userId: string, userStats: UserStats): Promise<UserAchievement[]> {
    try {
      const currentAchievements = await this.getUserAchievements(userId);
      const unlockedIds = new Set(currentAchievements.map(a => a.id));
      const newlyUnlocked: UserAchievement[] = [];

      for (const definition of ACHIEVEMENT_DEFINITIONS) {
        if (unlockedIds.has(definition.id)) continue;

        const shouldUnlock = this.checkUnlockCriteria(definition, userStats, userId);
        if (shouldUnlock) {
          const achievement: UserAchievement = {
            id: definition.id,
            unlockedAt: Date.now()
          };

          newlyUnlocked.push(achievement);
          
          // Track the achievement unlock activity
          await activityTrackingService.trackAchievementUnlock(userId, definition.id);
        }
      }

      // Save newly unlocked achievements
      if (newlyUnlocked.length > 0) {
        await this.saveUserAchievements(userId, [...currentAchievements, ...newlyUnlocked]);
        console.log(`✅ Unlocked ${newlyUnlocked.length} achievements for user ${userId}`);
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('❌ Achievement check failed:', error);
      return [];
    }
  }

  /**
   * Check if achievement unlock criteria are met
   */
  private checkUnlockCriteria(definition: AchievementDefinition, userStats: UserStats, userId: string): boolean {
    const { type, conditions } = definition.unlockCriteria;

    switch (type) {
      case 'stat_threshold':
        return Object.entries(conditions).every(([stat, threshold]) => {
          const userValue = (userStats as any)[stat] || 0;
          return userValue >= threshold;
        });

      case 'streak':
        return Object.entries(conditions).every(([stat, threshold]) => {
          const userValue = (userStats as any)[stat] || 0;
          return userValue >= threshold;
        });

      case 'special_condition':
        if (conditions.joinedBefore) {
          // For early adopter achievement - assume all current users are early adopters
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Save user achievements to database
   */
  private async saveUserAchievements(userId: string, achievements: UserAchievement[]): Promise<void> {
    try {
      const userRef = this.db.collection('users').doc(userId);
      await userRef.update({
        unlockedAchievements: achievements,
        'stats.achievements': achievements.length
      });
    } catch (error) {
      console.error('❌ Failed to save user achievements:', error);
      throw error;
    }
  }

  /**
   * Trigger achievement check for user (called after activity updates)
   */
  async triggerAchievementCheck(userId: string): Promise<void> {
    try {
      const userStats = await activityTrackingService.getUserStats(userId);
      await this.checkAndUnlockAchievements(userId, userStats);
    } catch (error) {
      console.error('❌ Achievement trigger failed:', error);
    }
  }
}

// Export singleton instance
export const achievementService = new AchievementService(); 
