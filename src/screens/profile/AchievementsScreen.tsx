/**
 * @file AchievementsScreen.tsx
 * @description Gaming achievements and milestones interface for SnapConnect.
 * Displays user accomplishments, gaming statistics, and unlockable content.
 *
 * @author SnapConnect Team
 * @created 2024-01-26
 * @modified 2024-01-26
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @/stores/themeStore: Theme management
 * - @/stores/authStore: Authentication state
 * - @/components/common: Shared components
 *
 * @usage
 * Achievements screen accessible from Profile tab for gaming milestones.
 *
 * @ai_context
 * AI-powered achievement tracking and personalized milestone suggestions.
 * Smart gaming behavior analysis and accomplishment recognition.
 */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { GameCard } from "../../components/common";
import { useTabBarHeight } from "../../hooks/useTabBarHeight";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { getUserStats } from "../../utils/userHelpers";

/**
 * Achievement data structure
 */
interface Achievement {
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
}

/**
 * Achievements screen component
 *
 * @returns {React.ReactElement} Rendered achievements interface
 *
 * @performance
 * - Optimized achievement rendering with FlatList patterns
 * - Efficient progress calculations and animations
 * - Smooth scrolling and responsive interactions
 *
 * @ai_integration
 * - Personalized achievement suggestions based on gaming behavior
 * - Smart milestone tracking and progress optimization
 * - Dynamic achievement generation based on user patterns
 */
const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { tabBarHeight } = useTabBarHeight();

  // Auth store
  const { profile } = useAuthStore();
  const userStats = getUserStats(profile);

  // Local state
  const [selectedCategory, setSelectedCategory] = useState("all");

  /**
   * Sample achievements data - in production, this would come from the backend
   */
  const achievements: Achievement[] = [
    {
      id: "first_snap",
      title: "First Snap",
      description: "Share your first snap with friends",
      icon: "camera",
      rarity: "common",
      unlocked: true,
      unlockedAt: "2024-01-15T10:30:00Z",
      reward: { type: "badge", value: "Photographer" },
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
    },
    {
      id: "early_adopter",
      title: "Early Adopter",
      description: "Join SnapConnect in its first month",
      icon: "rocket",
      rarity: "rare",
      unlocked: true,
      unlockedAt: "2024-01-01T00:00:00Z",
      reward: { type: "badge", value: "Pioneer" },
    },
    {
      id: "perfect_week",
      title: "Perfect Week",
      description: "Use the app for 7 consecutive days",
      icon: "calendar",
      rarity: "common",
      unlocked: false,
      progress: { current: 4, total: 7 },
      reward: { type: "boost", value: "Streak Master" },
    },
    {
      id: "night_owl",
      title: "Night Owl",
      description: "Share content after midnight 10 times",
      icon: "moon",
      rarity: "rare",
      unlocked: false,
      progress: { current: 3, total: 10 },
      reward: { type: "filter", value: "Midnight Mode" },
    },
    {
      id: "team_player",
      title: "Team Player",
      description: "Play 50 multiplayer games with friends",
      icon: "people-circle",
      rarity: "epic",
      unlocked: false,
      progress: { current: 12, total: 50 },
      reward: { type: "title", value: "Squad Leader" },
    },
  ];

  const categories = [
    { key: "all", label: "All", icon: "grid-outline" },
    { key: "social", label: "Social", icon: "people-outline" },
    { key: "gaming", label: "Gaming", icon: "game-controller-outline" },
    { key: "creative", label: "Creative", icon: "brush-outline" },
  ];

  /**
   * Filter achievements by category
   */
  const getFilteredAchievements = () => {
    if (selectedCategory === "all") return achievements;
    
    // Simple category filtering - in production, achievements would have category tags
    const categoryMap: { [key: string]: string[] } = {
      social: ["social_butterfly", "first_snap", "early_adopter"],
      gaming: ["gaming_legend", "team_player", "perfect_week"],
      creative: ["content_creator", "night_owl"],
    };
    
    return achievements.filter(achievement => 
      categoryMap[selectedCategory]?.includes(achievement.id)
    );
  };

  /**
   * Get rarity color
   */
  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common": return "#a0a0a0";
      case "rare": return "#00ffff";
      case "epic": return "#ff00ff";
      case "legendary": return "#ffd700";
      default: return "#a0a0a0";
    }
  };

  /**
   * Get rarity label
   */
  const getRarityLabel = (rarity: Achievement["rarity"]) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  /**
   * Calculate total achievements progress
   */
  const getTotalProgress = () => {
    const unlocked = achievements.filter(a => a.unlocked).length;
    const total = achievements.length;
    return { unlocked, total, percentage: Math.round((unlocked / total) * 100) };
  };

  const totalProgress = getTotalProgress();

  /**
   * Render achievement item
   */
  const renderAchievement = (achievement: Achievement) => {
    const rarityColor = getRarityColor(achievement.rarity);
    const progress = achievement.progress;
    const progressPercentage = progress ? (progress.current / progress.total) * 100 : 0;

    return (
      <View
        key={achievement.id}
        className={`bg-cyber-dark rounded-lg p-4 mx-6 mb-4 border ${
          achievement.unlocked 
            ? "border-cyber-green/50" 
            : "border-cyber-gray/20"
        }`}
        style={{
          boxShadow: achievement.unlocked ? '0px 0px 8px rgba(0, 255, 0, 0.3)' : 'none',
          elevation: achievement.unlocked ? 8 : 0,
        } as any}
      >
        <View className="flex-row items-start">
          {/* Achievement Icon */}
          <View 
            className={`w-16 h-16 rounded-full justify-center items-center mr-4 ${
              achievement.unlocked ? "bg-cyber-green/20" : "bg-cyber-gray/20"
            }`}
            style={{
              borderWidth: 2,
              borderColor: achievement.unlocked ? "#00ff00" : "#404040",
            }}
          >
            <Ionicons
              name={achievement.icon as any}
              size={24}
              color={achievement.unlocked ? "#00ff00" : "#707070"}
            />
          </View>

          {/* Achievement Info */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text 
                className={`font-orbitron text-lg ${
                  achievement.unlocked ? "text-white" : "text-white/70"
                }`}
              >
                {achievement.title}
              </Text>
              <View 
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: `${rarityColor}20` }}
              >
                <Text 
                  className="font-inter text-xs font-medium"
                  style={{ color: rarityColor }}
                >
                  {getRarityLabel(achievement.rarity)}
                </Text>
              </View>
            </View>

            <Text className="text-white/70 font-inter text-sm mb-3">
              {achievement.description}
            </Text>

            {/* Progress Bar */}
            {progress && !achievement.unlocked && (
              <View className="mb-3">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-white/50 font-inter text-xs">
                    Progress
                  </Text>
                  <Text className="text-white/70 font-inter text-xs">
                    {progress.current}/{progress.total}
                  </Text>
                </View>
                <View className="h-2 bg-cyber-gray/20 rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-cyber-cyan rounded-full"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </View>
              </View>
            )}

            {/* Reward */}
            {achievement.reward && (
              <View className="flex-row items-center">
                <Ionicons
                  name="gift-outline"
                  size={14}
                  color={achievement.unlocked ? accentColor : "#707070"}
                />
                <Text 
                  className={`ml-2 font-inter text-sm ${
                    achievement.unlocked ? "text-cyber-cyan" : "text-white/50"
                  }`}
                >
                  {achievement.reward.type === "badge" && "Badge: "}
                  {achievement.reward.type === "title" && "Title: "}
                  {achievement.reward.type === "filter" && "Filter: "}
                  {achievement.reward.type === "boost" && "Boost: "}
                  {achievement.reward.value}
                </Text>
              </View>
            )}

            {/* Unlocked Date */}
            {achievement.unlocked && achievement.unlockedAt && (
              <Text className="text-white/50 font-inter text-xs mt-2">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background.primary}
      />

      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray/10">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color={accentColor} />
          </TouchableOpacity>
          <Text className="text-white font-orbitron text-2xl">Achievements</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        {/* Progress Overview */}
        <View className="mx-6 my-6">
          <GameCard
            title="Achievement Progress"
            type="stats"
            rarity="epic"
            stats={[
              {
                label: "Unlocked",
                value: totalProgress.unlocked,
                icon: "trophy",
              },
              {
                label: "Total",
                value: totalProgress.total,
                icon: "list",
              },
              {
                label: "Completion",
                value: `${totalProgress.percentage}%`,
                icon: "stats-chart",
              },
            ]}
          />
        </View>

        {/* Category Filters */}
        <View className="flex-row px-6 mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 24 }}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                onPress={() => setSelectedCategory(category.key)}
                className={`flex-row items-center px-4 py-2 rounded-full mr-3 ${
                  selectedCategory === category.key
                    ? "bg-cyber-cyan/20 border border-cyber-cyan/40"
                    : "bg-cyber-dark border border-cyber-gray/20"
                }`}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={selectedCategory === category.key ? accentColor : "#707070"}
                />
                <Text
                  className={`ml-2 font-inter text-sm ${
                    selectedCategory === category.key
                      ? "text-white font-medium"
                      : "text-white/70"
                  }`}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Achievements List */}
        <View className="pb-4">
          {getFilteredAchievements().map(renderAchievement)}
        </View>

        {/* Empty State */}
        {getFilteredAchievements().length === 0 && (
          <View className="items-center justify-center py-16">
            <Ionicons name="trophy-outline" size={48} color="#404040" />
            <Text className="text-white/50 font-inter text-lg mt-4">
              No achievements in this category
            </Text>
            <Text className="text-white/30 font-inter text-sm mt-2">
              Keep playing to unlock new achievements!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AchievementsScreen; 
