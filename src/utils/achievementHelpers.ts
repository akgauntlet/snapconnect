/**
 * @file achievementHelpers.ts
 * @description Shared achievement calculation and tracking utilities.
 * Ensures consistent achievement counting and unlocking logic across the app.
 *
 * @author SnapConnect Team
 * @created 2024-01-26
 *
 * @dependencies
 * - @/utils/userHelpers: User stats utilities
 *
 * @usage
 * import { getActualAchievementCount, getAchievements } from '@/utils/achievementHelpers';
 *
 * @ai_context
 * AI-powered achievement tracking with dynamic unlocking based on user behavior.
 */

import { getUserStats } from './userHelpers';

/**
 * Achievement data structure
 */
export interface AchievementData {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlocked: boolean;
  unlockedAt?: string;
  progress?: {
    current: number;
    total: number;
  };
  reward?: {
    type: "badge" | "title" | "filter" | "boost";
    value: string;
  };
  tier?: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  points?: number;
}

/**
 * Get all available achievements with dynamic unlock status
 * @param {Object} profile - User profile from database
 * @returns {Array<AchievementData>} Array of achievements with current unlock status
 */
export function getAchievements(profile: any): AchievementData[] {
  const userStats = getUserStats(profile);

  return [
    {
      id: "first_snap",
      title: "First Snap",
      description: "Share your first snap with friends",
      icon: "camera",
      rarity: "common",
      unlocked: true, // Assuming user has shared at least one snap by being in the app
      unlockedAt: "2024-01-15T10:30:00Z",
      reward: { type: "badge", value: "Photographer" },
      tier: "bronze",
      points: 10,
    },
    {
      id: "gaming_legend",
      title: "Gaming Legend",
      description: "Win 100 gaming matches",
      icon: "trophy",
      rarity: "legendary",
      unlocked: userStats.victories >= 100,
      unlockedAt: userStats.victories >= 100 ? "2024-01-20T15:45:00Z" : undefined,
      progress: { current: userStats.victories, total: 100 },
      reward: { type: "title", value: "Gaming Legend" },
      tier: "diamond",
      points: 100,
    },
    {
      id: "social_butterfly",
      title: "Social Butterfly",
      description: "Add 50 friends to your network",
      icon: "people",
      rarity: "rare",
      unlocked: userStats.friends >= 50,
      progress: { current: userStats.friends, total: 50 },
      reward: { type: "boost", value: "Friend Finder" },
      tier: "silver",
      points: 25,
    },
    {
      id: "content_creator",
      title: "Content Creator",
      description: "Create 25 gaming highlights",
      icon: "play-circle",
      rarity: "epic",
      unlocked: userStats.highlights >= 25,
      progress: { current: userStats.highlights, total: 25 },
      reward: { type: "filter", value: "Creator Mode" },
      tier: "gold",
      points: 50,
    },
    {
      id: "early_adopter",
      title: "Early Adopter",
      description: "Join SnapConnect in its first month",
      icon: "rocket",
      rarity: "rare",
      unlocked: true, // Assuming all current users are early adopters
      unlockedAt: "2024-01-01T00:00:00Z",
      reward: { type: "badge", value: "Pioneer" },
      tier: "silver",
      points: 25,
    },
    {
      id: "perfect_week",
      title: "Perfect Week",
      description: "Use the app for 7 consecutive days",
      icon: "calendar",
      rarity: "common",
      unlocked: false, // TODO: Track consecutive usage days
      progress: { current: 4, total: 7 },
      reward: { type: "boost", value: "Streak Master" },
      tier: "bronze",
      points: 10,
    },
    {
      id: "night_owl",
      title: "Night Owl",
      description: "Share content after midnight 10 times",
      icon: "moon",
      rarity: "rare",
      unlocked: false, // TODO: Track midnight usage
      progress: { current: 3, total: 10 },
      reward: { type: "filter", value: "Midnight Mode" },
      tier: "silver",
      points: 25,
    },
    {
      id: "team_player",
      title: "Team Player",
      description: "Play 50 multiplayer games with friends",
      icon: "people-circle",
      rarity: "epic",
      unlocked: false, // TODO: Track multiplayer games
      progress: { current: 12, total: 50 },
      reward: { type: "title", value: "Squad Leader" },
      tier: "gold",
      points: 50,
    },
  ];
}

/**
 * Calculate the actual number of unlocked achievements
 * @param {Object} profile - User profile from database
 * @returns {number} Number of unlocked achievements
 */
export function getActualAchievementCount(profile: any): number {
  const achievements = getAchievements(profile);
  return achievements.filter(achievement => achievement.unlocked).length;
}

/**
 * Calculate total achievements progress
 * @param {Object} profile - User profile from database
 * @returns {Object} Progress data with unlocked count, total count, and percentage
 */
export function getAchievementProgress(profile: any): {
  unlocked: number;
  total: number;
  percentage: number;
} {
  const achievements = getAchievements(profile);
  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;
  
  return {
    unlocked,
    total,
    percentage: Math.round((unlocked / total) * 100),
  };
}

/**
 * Get achievements filtered by category
 * @param {Object} profile - User profile from database
 * @param {string} category - Category to filter by ('all', 'social', 'gaming', 'creative')
 * @returns {Array<AchievementData>} Filtered achievements
 */
export function getAchievementsByCategory(profile: any, category: string): AchievementData[] {
  const achievements = getAchievements(profile);
  
  if (category === "all") return achievements;
  
  const categoryMap: { [key: string]: string[] } = {
    social: ["social_butterfly", "first_snap", "early_adopter"],
    gaming: ["gaming_legend", "team_player", "perfect_week"],
    creative: ["content_creator", "night_owl"],
  };
  
  return achievements.filter(achievement => 
    categoryMap[category]?.includes(achievement.id)
  );
}

/**
 * Convert achievement to showcase format
 * @param {AchievementData} achievement - Achievement data
 * @returns {Object} Achievement in showcase format
 */
export function convertToShowcaseFormat(achievement: AchievementData) {
  return {
    id: achievement.id,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    rarity: achievement.rarity,
    tier: achievement.rarity, // Map rarity to tier for now
    points: achievement.rarity === "legendary" ? 100 : 
            achievement.rarity === "epic" ? 50 : 
            achievement.rarity === "rare" ? 25 : 10,
    unlockedAt: achievement.unlockedAt ? new Date(achievement.unlockedAt).getTime() : Date.now(),
  };
} 
